import matrixModule from "./modules/matrix.js";
import arcadeModule from "./modules/arcade.js";
import housingModule from "./modules/housing.js";

router.use("/matrix", matrixModule);
router.use("/arcade", arcadeModule);
router.use("/housing", housingModule);
