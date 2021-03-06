<?php

namespace AppBundle\Service;

use AppBundle\Entity\Statistics;
use Doctrine\ORM\EntityManager;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Templating\EngineInterface;

class Game
{
    protected $templating;
    protected $entityManager;
    protected $container;

    public function __construct(EntityManager $entityManager, EngineInterface $templating, ContainerInterface $container)
    {
        $this->entityManager = $entityManager;
        $this->templating = $templating;
        $this->container = $container;
    }

    /**
     * @param int $days
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function getBestPlayersArray($days = 10)
    {
        // Get game repository
        $gameRepository = $this->entityManager->getRepository('AppBundle:Game');

        // Get query for getting games
        $gameQuery = $gameRepository
            ->getGamesByDate((new \DateTime('now'))->modify('-'.$days.' day'), new \DateTime('now'));

        // Get array of sorting matches for team
        $sortingTeams = $this->parseGamesByPlayers($gameQuery->getResult(), true);

        return $sortingTeams;
    }

    /**
     * @param \AppBundle\Entity\Game[] $games
     * @param bool|false $sortingByPercent
     * @return array
     */
    public function parseGamesByPlayers($games, $sortingByPercent = false)
    {
        // Array for saving matches by team (key - team id, value = array with matches)
        $sortingGames = array();

        foreach ($games as $game) {
            $firstTeamID = $game->getFirstTeam()->getId();
            $secondTeamID = $game->getSecondTeam()->getId();

            if (!array_key_exists($firstTeamID, $sortingGames)) {
                $sortingGames[$firstTeamID] = array(
                    'drawn' => array(),
                    'won' => array(),
                    'lost' => array(),
                    'team' => $game->getFirstTeam(),
                    'greatVictories' => array(
                        'games' => array(),
                        'difference' => 0
                    ),
                    'greatDefeats' => array(
                        'games' => array(),
                        'difference' => 0
                    )
                );
            }

            if (!array_key_exists($secondTeamID, $sortingGames)) {
                $sortingGames[$secondTeamID] = array(
                    'drawn' => array(),
                    'won' => array(),
                    'lost' => array(),
                    'team' => $game->getSecondTeam(),
                    'greatVictories' => array(
                        'games' => array(),
                        'difference' => 0
                    ),
                    'greatDefeats' => array(
                        'games' => array(),
                        'difference' => 0
                    )
                );
            }

            switch ($game->getResult()) {
                case 0:
                    $sortingGames[$firstTeamID]['drawn'][] = $game;
                    $sortingGames[$secondTeamID]['drawn'][] = $game;
                    break;

                case 1:
                    $sortingGames[$firstTeamID]['won'][] = $game;
                    $sortingGames[$secondTeamID]['lost'][] = $game;

                    if ($game->getDifference() > $sortingGames[$firstTeamID]['greatVictories']['difference']) {
                        $sortingGames[$firstTeamID]['greatVictories']['difference'] = $game->getDifference();
                        $sortingGames[$firstTeamID]['greatVictories']['games'] = array($game);
                    } elseif ($game->getDifference() == $sortingGames[$firstTeamID]['greatVictories']['difference']) {
                        $sortingGames[$firstTeamID]['greatVictories']['games'][] = $game;
                    }
                    if ($game->getDifference() > $sortingGames[$secondTeamID]['greatDefeats']['difference']) {
                        $sortingGames[$secondTeamID]['greatDefeats']['difference'] = $game->getDifference();
                        $sortingGames[$secondTeamID]['greatDefeats']['games'] = array($game);
                    } elseif ($game->getDifference() == $sortingGames[$secondTeamID]['greatDefeats']['difference']) {
                        $sortingGames[$firstTeamID]['greatDefeats']['games'][] = $game;
                    }
                    break;

                case 2:
                    $sortingGames[$firstTeamID]['lost'][] = $game;
                    $sortingGames[$secondTeamID]['won'][] = $game;

                    if ($game->getDifference() > $sortingGames[$secondTeamID]['greatVictories']['difference']) {
                        $sortingGames[$secondTeamID]['greatVictories']['difference'] = $game->getDifference();
                        $sortingGames[$secondTeamID]['greatVictories']['games'] = array($game);
                    } elseif ($game->getDifference() == $sortingGames[$secondTeamID]['greatVictories']['difference']) {
                        $sortingGames[$secondTeamID]['greatVictories']['games'][] = $game;
                    }
                    if ($game->getDifference() > $sortingGames[$firstTeamID]['greatDefeats']['difference']) {
                        $sortingGames[$firstTeamID]['greatDefeats']['difference'] = $game->getDifference();
                        $sortingGames[$firstTeamID]['greatDefeats']['games'] = array($game);
                    } elseif ($game->getDifference() == $sortingGames[$firstTeamID]['greatDefeats']['difference']) {
                        $sortingGames[$firstTeamID]['greatDefeats']['games'][] = $game;
                    }
                    break;
            }
        }

        // Array for saving team percent of won games
        if ($sortingByPercent) {
            $sortingByValue = $this->sortByWonPercent($sortingGames);
        } else {
            $sortingByValue = $sortingGames;
        }

        // Save matches from games array to percent array
        foreach ($sortingByValue as $key => $value) {
            $sortingByValue[$key] = $sortingGames[$key];
        }

        return $sortingByValue;
    }

    /**
     * @param array $sortingGames
     * @return array
     */
    protected function sortByWonPercent(&$sortingGames)
    {
        $sortingByValue = array();

        foreach ($sortingGames as $key => &$item) {
            $countGame = count($item['won']) + count($item['drawn']) + count($item['lost']);
            $percentWon = (count($item['won'])/$countGame)*100;
            $item['gameCount'] = $countGame;
            $item['wonPercent'] = $percentWon;

            $sortingByValue[$key] = $percentWon;
        }

        arsort($sortingByValue);

        return $sortingByValue;
    }

    protected function removeGame(\AppBundle\Entity\Game $game)
    {
        $this->entityManager->remove($game);
        $this->container->get('app.team_service')->updateStatistics($game, Statistics::ACTION_REMOVE);
    }

}
