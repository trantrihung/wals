import { privateKey } from "./app/accounts/accounts.js";
import { Config } from "./app/config/config.js";
import { COINENUM } from "./app/src/core/coin/coin_enum.js";
import Core from "./app/src/core/core.js";
import { Helper } from "./app/src/utils/helper.js";
import Logger from "./app/src/utils/Logger.js";

const MIN_BALANCE = Config.TXAMOUNTMAX;
const SWAP_COUNT = Config.SWAPCOUNT;
const DELAY_HOURS = Config.DELAYINHOURS || 6;
console.clear();

async function performOperations(core) {
  await core.getAccountInfo();
  await core.getBalance(true);
  // await core.requestFaucet();

  const hasNFT = await core.checkNFT();
  if (!hasNFT) {
    await core.mintNft();
  }

  const suiBalance = core.balance.find((coin) => coin.coinType === COINENUM.SUI)?.totalBalance || 0;

  if (suiBalance < MIN_BALANCE) {
    throw new Error(`Số dư tối thiểu cần có là ${MIN_BALANCE} SUI`);
  }

  for (let i = 0; i < SWAP_COUNT; i++) {
    try {
      await core.exSuiToWal();
      await core.exWalToSui();
      core.txCount++;
    } catch (error) {
      Logger.error(`Swap Error : ${error.message}`);
    }
  }

  await core.exSuiToWal();
  await core.stakeWalToOperator();
}

async function operateAccount(privateKey, privateKeys, index) {
  const core = new Core(privateKey);
  try {
    await performOperations(core);

    const delayMs = 3600000 * DELAY_HOURS;
    const accountIndex = index + 1;

    await Helper.delay(
      delayMs,
      privateKey,
      `Tài khoản ${accountIndex} Đã xử lý xong, chờ ${Helper.msToTime(delayMs)}`,
      core
    );

    if (index + 1 >= privateKeys.length) {
      console.log("Không còn tài khoản nào để xử lý nữa. Dừng lại !");
      return;
    }

    await operateAccount(privateKeys[index + 1], privateKeys, index + 1);
  } catch (error) {
    const errorMessage = error.message || JSON.stringify(error);
    await Helper.delay(10000, privateKey, `Error : ${errorMessage}, Thử lại sau 10 giây`, core);

    if (index + 1 >= privateKeys.length) {
      console.log("Không còn tài khoản nào để xử lý nữa. Dừng lại !");
      return;
    }

    await operateAccount(privateKeys[index + 1], privateKeys, index + 1);
  }
}

async function startBot() {
  try {
    Logger.info(" Bắt đầu...");
    if (privateKey.length === 0) {
      throw new Error("Vui lòng nhập tài khoản của bạn vào tệp accounts.js trước !");
    }
    await Promise.all(privateKey.map((key, index) => operateAccount(key, privateKey, index)));
  } catch (error) {
    Logger.info("Dừng lại...");
    Logger.error(JSON.stringify(error));
    throw error;
  }
}

(async () => {
  try {
    Logger.clear();
    Logger.info("Tiến trình đã bắt đầu !");
    Helper.showLogo();

    if (privateKey.length < 1) {
      throw new Error("Vui lòng nhập tài khoản của bạn vào tệp accounts.js trước !");
    }

    await startBot();
  } catch (error) {
    console.error("Lỗi trong quá trình thực thi :", error);
    throw error;
  }
})();
