import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pokemonRouter from "./pokemon";
import regulationsRouter from "./regulations";
import archetypesRouter from "./archetypes";
import teamsRouter from "./teams";
import analysisRouter from "./analysis";
import gameDataRouter from "./game-data";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pokemonRouter);
router.use(regulationsRouter);
router.use(archetypesRouter);
router.use(teamsRouter);
router.use(analysisRouter);
router.use(gameDataRouter);

export default router;
