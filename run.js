// Import the API, Keyring and some utility functions
const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require("@polkadot/keyring");
const fs = require("fs");
const { resolve } = require("path");

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
  })
  .option("start-amount", {
    type: "num",
    description: "The starting amount for listing",
    required: false,
  })
  .option("limit", {
    type: "num",
    description: "The limit amount for listing",
    required: false,
  })
  .option("decrease", {
    type: "boolean",
    description: "Flag for decreasing the listing",
    required: false,
    default: false,
  }).argv;

let ROUND = 1;

async function main() {
  const provider = new WsProvider(options["endpoint"]);

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
  const startAmount =
    typeof options["start-amount"] !== "undefined"
      ? options["start-amount"]
      : 0;
  const limit = options["limit"];
  const shouldDecrease = options["decrease"];

  /// KSM Precision [kusama guide](https://guide.kusama.network/docs/kusama-parameters/#precision)
  const ksmPrecision = 1_000_000_000_000;

  const amountPrecision = amount * ksmPrecision;
  const startAmountPrecision = startAmount * ksmPrecision;
  const limitPrecision = limit * ksmPrecision;

  console.log("💰 Starting amount:", startAmount);
  console.log("💰 Amount to be listed linearly:", amount);

  let account = keyring.addFromUri(key[0]);
  console.log("🤖 ACCOUNT_ADDRESS:", account.address);

  const shouldPutStartingAmount = startAmount > 0 && ROUND == 1;

  if (shouldPutStartingAmount) {
    const tx = api.tx.system.remark(
      `RMRK::LIST::1.0.0::${rmrkId}::${startAmountPrecision}`
    );
    console.log(tx.toHuman());

    //const _ = await sendAndFinalize(tx, account);
  }

  await new Promise((_) =>
    setInterval(async function () {

      var _amount;

      if (shouldDecrease) {
        _amount = startAmountPrecision - amountPrecision * ROUND;
      } else {
        _amount = startAmountPrecision + amountPrecision * ROUND;
      }

      const tx = api.tx.system.remark(
        `RMRK::LIST::1.0.0::${rmrkId}::${_amount}`
      );
      ROUND++;
      console.log(tx.toHuman());

      if (shouldDecrease && _amount <= 0) {
        throw new Error("Amount have reached 0");
      } 

      if (limit !== undefined) {
        if (shouldDecrease && _amount < limitPrecision) {
          // exit
          process.exit();
        } else if (!shouldDecrease && _amount > limitPrecision) {
          // exit 
          process.exit()
        }
      }

      //const _ = await sendAndFinalize(tx, account);
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
