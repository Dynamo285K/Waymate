import { carErrorToHttpStatus, CarErrorCodes } from "./src/modules/cars/car.errors";
console.log("ModelNotFound:", carErrorToHttpStatus(CarErrorCodes.ModelNotFound));
console.log("CarNotFound:", carErrorToHttpStatus(CarErrorCodes.CarNotFound));
console.log("DuplicatePlate:", carErrorToHttpStatus(CarErrorCodes.DuplicatePlate));
