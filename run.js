// Import the API, Keyring and some utility functions
const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require("@polkadot/keyring");
const fs = require("fs");

const options = require("yargs")
  .option("id", {
    type: "string",
    description: "A file with RMRK IDs.",
    required: true,
  })
  .option("endpoint", {
    alias: "e",
    type: "string",
    description:
      "The wss endpoint. [Westend = wss://westend-rpc.polkadot.io] [Kusama = wss://kusama-rpc.polkadot.io]",
    required: true,
  })
  .option("secret-key", {
    alias: "s",
    type: "string",
    description:
      "A file with secret key or seed phrases. It is not saved anywhere.",
    required: true,
  })
  .option("amount", {
    alias: "a",
    type: "num",
    description: "How much should be added linearly to the listing price",
    required: true,
  })
  .option("timeinterval", {
    alias: "t",
    type: "num",
    description: "Timeinterval for listing in seconds",
    required: true,
  }).argv;

let ROUND = 1;

async function main() {
  const provider = new WsProvider(options['endpoint']);

  const api = await ApiPromise.create({ provider });

  console.log(
    `Connected to node: ${(await api.rpc.system.chain()).toHuman()} [ss58: ${
      api.registry.chainSS58
    }]`
  );

  const keyring = new Keyring({
    type: "sr25519",
    ss58Format: api.registry.chainSS58,
  });

  const rmrkId = options["id"];
  const key =
    typeof options["secret-key"] !== "undefined"
      ? fs
          .readFileSync(`${options["secret-key"]}`, "UTF-8")
          .split(/\r?\n/)
          .filter((entry) => entry.trim() != "")
      : undefined;
  const amount = options["amount"];
  const time = options["timeinterval"];

  /// KSM Precision [kusama guide](https://guide.kusama.network/docs/kusama-parameters/#precision)
  const ksmPrecision = 1_000_000_000_000;

  const amountPrecision = amount * ksmPrecision;

  console.log("💰 Amount to be listed linearly:", amount);

  let account = keyring.addFromUri(key[0]);
  console.log("🤖 ACCOUNT_ADDRESS:", account.address);

  await new Promise((_) =>
    setInterval(async function () {
      const tx = api.tx.system.remark(
        `RMRK::LIST::1.0.0::${rmrkId}::${amountPrecision * ROUND}`
      );
      ROUND++;
      console.log(tx.toHuman());

      await sendAndFinalize(tx, account);
    }, time * 1000)
  );
}

async function sendAndFinalize(tx, account) {
  return new Promise(async (resolve) => {
    let success = false;
    let included = [];
    let finalized = [];
    let unsubscribe = await tx.signAndSend(
      account,
      ({ events = [], status, dispatchError }) => {
        if (status.isInBlock) {
          success = dispatchError ? false : true;
          console.log(
            `📀 Transaction ${tx.meta.name} included at blockHash ${status.asInBlock} [success = ${success}]`
          );
          included = [...events];
        } else if (status.isBroadcast) {
          console.log(`🚀 Transaction broadcasted.`);
        } else if (status.isFinalized) {
          status.is;
          console.log(
            `💯 Transaction ${tx.meta.name}(..) Finalized at blockHash ${status.asFinalized}`
          );
          finalized = [...events];
          let hash = status.hash;
          unsubscribe();
          resolve({ success, hash, included, finalized });
        } else if (status.isReady) {
          // let's not be too noisy..
        } else {
          console.log(`🤷 Other status ${status}`);
        }
      }
    );
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit());
