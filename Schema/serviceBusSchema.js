var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const schemaGenerator = async (schemaName) => {
  const listOfCollections = await mongoose.connection.db.collections();

  let collection = null;
  collection =
    listOfCollections &&
    listOfCollections.find((item) => item.collectionName == schemaName);

  if (!collection) {
    collection = await mongoose.model(
      schemaName,
      new Schema({ _id: Number, data: { type: Object } }, { _id: false }),
      schemaName
    );
  }
  return collection;
};

module.exports = { schemaGenerator };
