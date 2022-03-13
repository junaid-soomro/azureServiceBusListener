var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const dbSchema = new Schema({ id: Number }, { strict: false });

const schemaGenerator = async (schemaName) => {
  collection = await mongoose.model(schemaName, dbSchema, schemaName);

  return collection;
};

module.exports = { schemaGenerator };
