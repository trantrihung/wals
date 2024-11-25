import { Twisters } from "twisters";
import Logger from "./Logger.js";
import Core from "../core/core.js";
import { privateKey } from "../../accounts/accounts.js";
import "../core/network/rpc.js";
import { Config } from "../../config/config.js";
import { COINENUM } from "../core/coin/coin_enum.js";

console.clear();
class ConsoleColors {
  static BLACK = "\x1b[30m";
  static RED = "\x1b[31m";
  static GREEN = "\x1b[32m";
  static YELLOW = "\x1b[33m";
  static BLUE = "\x1b[34m";
  static MAGENTA = "\x1b[35m";
  static CYAN = "\x1b[36m";
  static WHITE = "\x1b[37m";
  static RESET = "\x1b[0m"; // Reset to default color
  static DIM_YELLOW = "\x1b[37m"; // Dim Yellow
}

class Twist {
  constructor() {
    this.twisters = new Twisters();
  }

  log(status = "", accountKey = "", accountData = new Core(), delay) {
    const accountIndex = privateKey.indexOf(accountKey);
    if (delay == undefined) {
      Logger.info(`Account ${accountIndex + 1} - ${status}`);
      delay = "-";
    }

    const address = accountData.address ?? "-";
    const balances = accountData.balance ?? [];
    const suiBalance = balances.find((b) => b.coinType === COINENUM.SUI);
    const suiBalanceStr = (suiBalance ? suiBalance.totalBalance : "?") + " SUI";
    const walBalance = balances.find((b) => b.coinType === COINENUM.WAL);
    const walBalanceStr = (walBalance ? walBalance.totalBalance : "?") + " WAL";
    const now = new Date().toISOString().split(".")[0].replace("T", " ");

    this.twisters.put(accountKey, {
      spinner: "dots",
      color: "cyan",
      text: `${ConsoleColors.WHITE}=========================== ${ConsoleColors.GREEN}Account ${accountIndex + 1} ${ConsoleColors.WHITE}===========================${ConsoleColors.RESET}
      ┌ ${ConsoleColors.GREEN}Địa chỉ ví : ${ConsoleColors.DIM_YELLOW}${address.substring(0, 12)}...${address.slice(-12).split("").reverse().join("")}${ConsoleColors.RESET}
      └ ${ConsoleColors.GREEN}Số dư : ${ConsoleColors.RESET}
      ┌ ${ConsoleColors.DIM_YELLOW}${suiBalanceStr}${ConsoleColors.RESET}
      └ ${ConsoleColors.DIM_YELLOW}${walBalanceStr}${ConsoleColors.RESET}
      ├ ${ConsoleColors.GREEN}Số lần sẽ thực hiện giao dịch : ${ConsoleColors.DIM_YELLOW}${accountData.txCount ?? 0} / ${Config.SWAPCOUNT} ${(accountData.txCount ?? 0) == Config.SWAPCOUNT ? "Finished" : ""}${ConsoleColors.RESET}
      ┌ ${ConsoleColors.GREEN}Trạng thái : ${ConsoleColors.RESET} ${ConsoleColors.DIM_YELLOW}${status}${ConsoleColors.RESET}
      └ ${ConsoleColors.GREEN}Thời gian chờ :${ConsoleColors.RESET} ${ConsoleColors.DIM_YELLOW}${delay}${ConsoleColors.RESET}
${ConsoleColors.WHITE}==================================================================${ConsoleColors.RESET
      }\n\n`,
    });
  }
  info(message = "") {
    this.twisters.put(2, {
      spinner: "dots",
      color: "cyan",
      text: `
==============================================
Info : ${message}
==============================================${delay}${ConsoleColors.RESET}`,
    });
  }
  clearInfo() {
    this.twisters.remove(2);
  }
  clear(key) {
    this.twisters.remove(key);
  }
}
export default new Twist();
