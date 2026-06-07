import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pokemonRouter from "./pokemon";
import regulationsRouter from "./regulations";
import archetypesRouter from "./archetypes";
import teamsRouter from "./teams";
import analysisRouter from "./analysis";
import gameDataRouter from "./game-data";
import tournamentRouter from "./tournament-teams";
import authRouter from "./auth";
import battleRouter from "./battle";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(pokemonRouter);
router.use(regulationsRouter);
router.use(archetypesRouter);
router.use(teamsRouter);
router.use(analysisRouter);
router.use(gameDataRouter);
router.use(tournamentRouter);
router.use(battleRouter);

export default router;
