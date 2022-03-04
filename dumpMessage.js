const schemaGenerator = require("./Schema/serviceBusSchema").schemaGenerator;

const dumpEventToDatabase = async (collectionName, record) => {
  try {
    let currentSchema = await schemaGenerator(collectionName);

    const respo = await currentSchema.updateOne(
      { _id: record.id },
      { $set: { data: record?.data } },
      { upsert: true }
    );
    console.log("MESSAGE DUMPED TO DB: ", respo);
  } catch (e) {
    console.log("Could not save data to database.", e);
  }
};

module.exports = { dumpEventToDatabase };
