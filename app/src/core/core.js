import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import {
  FaucetRateLimitError,
  getFaucetHost,
  requestSuiFromFaucetV0,
} from "@mysten/sui/faucet";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Helper } from "../utils/helper.js";
import { Transaction } from "@mysten/sui/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { RPC } from "./network/rpc.js";
import { Config } from "../../config/config.js";
import { COINENUM } from "./coin/coin_enum.js";
import logger from "../utils/Logger.js";

export default class Core {
  constructor(privateKey) {
    this.acc = privateKey;
    this.txCount = 0;
    this.client = new SuiClient({ url: getFullnodeUrl("testnet") });
    this.walrusAddress =
      "0x9f992cc2430a1f442ca7a5ca7638169f5d5c00e0ebc3977a65e9ac6e497fe5ef";
    this.walrusExchangeObjectId =
      "0x0e60a946a527902c90bbc71240435728cd6dc26b9e8debc69f09b71671c3029b";
    this.walrusPoolObjectId =
      "0x37c0e4d7b36a2f64d51bba262a1791f844cfd88f31379f1b7c04244061d43914";
    this.flatLanderNFT =
      "0x4cb65566af16acb9ae48c437e99653e77c06c1b712329486987223ca99f44575";
    this.randomObjectId =
      "0x0000000000000000000000000000000000000000000000000000000000000008";
  }

  async getAccountInfo() {
    try {
      await Helper.delay(500, this.acc, "Đang lấy thông tin tài khoản...", this);
      const decodedPrivateKey = decodeSuiPrivateKey(this.acc);
      
      if (!decodedPrivateKey || !decodedPrivateKey.secretKey) {
        throw new Error("Private Key không hợp lệ. Không thể giải mã !");
      }
      
      this.wallet = Ed25519Keypair.fromSecretKey(decodedPrivateKey.secretKey);
      this.address = this.wallet.getPublicKey().toSuiAddress();
      await Helper.delay(
        1000,
        this.acc,
        "Đã lấy thông tin tài khoản thành công",
        this
      );
    } catch (error) {
      logger.error(`Lỗi khi lấy thông tin tài khoản : ${error.message}`);
      throw error;
    }
  }

  async requestFaucet() {
    try {
      await Helper.delay(500, this.acc, "Đang yêu cầu SUI Testnet", this);
      await requestSuiFromFaucetV0({
        host: getFaucetHost("testnet"),
        recipient: this.address,
      });
      await Helper.delay(
        1000,
        this.acc,
        "Yêu cầu SUI Testnet thành công",
        this
      );
      await this.getBalance();
    } catch (error) {
      if (error instanceof FaucetRateLimitError) {
        await Helper.delay(2000, this.acc, error.message, this);
      } else {
        throw error;
      }
    }
  }

  async getTransactionDetail() {
    try {
    } catch (error) {
      throw error;
    }
  }

  async transferCoin() {
    try {
      await Helper.delay(500, this.acc, "Cố gắng chuyển SUI", this);
      const amount =
        Number(Helper.random(Config.TXAMOUNTMIN, Config.TXAMOUNTMAX)) *
        Number(MIST_PER_SUI);
      const transaction = new Transaction();
      const coinToTransfer = transaction.splitCoins(transaction.gas, [amount]);
      transaction.transferObjects(
        [coinToTransfer],
        "0xc17539c8caaee52123447a81c0f591e91f068d36a334ceb231463cd8b5053557"
      );
      await this.executeTx(transaction);
    } catch (error) {
      throw error;
    }
  }

  async mergeCoin() {
    try {
      await Helper.delay(500, this.acc, "Đang hợp nhất đồng tiền", this);
      const coins = await this.client.getCoins({
        owner: this.address,
        coinType: COINENUM.WAL,
      });
      if (!coins.data || coins.data.length < 2) {
        await Helper.delay(1000, this.acc, "Không cần hợp nhất đồng tiền", this);
        return;
      }
      const transaction = new Transaction();
      const primaryCoin = coins.data[0].coinObjectId;
      const coinsToMerge = coins.data.slice(1).map((coin) => coin.coinObjectId);
      await Helper.delay(
        1000,
        this.acc,
        `Đang hợp nhất ${coinsToMerge.length} đối tượng của ${COINENUM.WAL}`,
        this
      );
      await transaction.mergeCoins(
        transaction.object(primaryCoin),
        coinsToMerge.map((coinId) => transaction.object(coinId))
      );
      await this.executeTx(transaction);
    } catch (error) {
      throw error;
    }
  }


  async checkNFT() {
    try {
      await Helper.delay(500, this.acc, "Đang kiểm tra NFT của người dùng", this);
      const ownedObjects = await this.client.getOwnedObjects({
        owner: this.address,
        options: {
          showBcs: true,
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const flatlanderNFTs = ownedObjects.data.filter((object) => {
        return object.data.type == COINENUM.FLATLANDERNFT;
      });
      if (flatlanderNFTs.length !== 0) {
        await Helper.delay(
          2000,
          this.acc,
          `Bạn đã có ${flatlanderNFTs.length} đối tượng của ${COINENUM.FLATLANDERNFT}`,
          this
        );
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async mintNft() {
    try {
      await Helper.delay(
        3000,
        this.acc,
        `Đang mint ${COINENUM.FLATLANDERNFT} NFT`,
        this
      );
      const randomObject = await this.client.getObject({
        id: this.randomObjectId,
        options: {
          showBcs: true,
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const transaction = new Transaction();
      const sharedObject = transaction.sharedObjectRef({
        objectId: randomObject.data.objectId,
        initialSharedVersion:
          randomObject.data.owner.Shared.initial_shared_version,
        mutable: false,
      });
      await transaction.moveCall({
        target: `${this.flatLanderNFT}::flatland::mint`,
        arguments: [sharedObject],
      });
      await this.executeTx(transaction);
    } catch (error) {
      await Helper.delay(
        3000,
        this.acc,
        error.message ?? "Không thể mint NFT",
        this
      );
    }
  }

  async exWalToSui() {
    try {
      await this.mergeCoin();
      await Helper.delay(
        1000,
        this.acc,
        "Đang trao đổi WAL → SUI",
        this
      );
      const coins = await this.client.getCoins({
        owner: this.address,
        coinType: COINENUM.WAL,
      });
      const coin = coins.data[0];
      const balance = coin.balance;
      const exchangeObject = await this.client.getObject({
        id: this.walrusExchangeObjectId,
        options: {
          showBcs: true,
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const transaction = new Transaction();
      const sharedObject = transaction.sharedObjectRef({
        objectId: exchangeObject.data.objectId,
        initialSharedVersion:
          exchangeObject.data.owner.Shared.initial_shared_version,
        mutable: true,
      });
      const coinToExchange = await transaction.splitCoins(
        transaction.object(coin.coinObjectId),
        [balance]
      );
      const exchangedCoin = transaction.moveCall({
        target: `${this.walrusAddress}::wal_exchange::exchange_all_for_sui`,
        arguments: [sharedObject, transaction.object(coinToExchange)],
      });
      await transaction.transferObjects([exchangedCoin], this.address);
      await this.executeTx(transaction);
    } catch (error) {
      throw error;
    }
  }

  async stakeWalToOperator() {
    try {
      await this.mergeCoin();
      await Helper.delay(1000, this.acc, "Thực hiện Stake WAL vào Operator", this);
      const coins = await this.client.getCoins({
        owner: this.address,
        coinType: COINENUM.WAL,
      });
      const coin = coins.data[0];
      const balance = coin.balance;
      const poolObject = await this.client.getObject({
        id: this.walrusPoolObjectId,
        options: {
          showBcs: true,
          showContent: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const operatorObject = await this.client.getObject({
        id: Config.STAKENODEOPERATOR,
        options: {
          showBcs: true,
          showContent: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const transaction = new Transaction();
      const sharedPoolObject = transaction.sharedObjectRef({
        objectId: poolObject.data.objectId,
        initialSharedVersion:
          poolObject.data.owner.Shared.initial_shared_version,
        mutable: true,
      });
      const coinToStake = await transaction.splitCoins(
        transaction.object(coin.coinObjectId),
        [balance]
      );
      const stakedCoin = transaction.moveCall({
        target: `${this.walrusAddress}::staking::stake_with_pool`,
        arguments: [
          sharedPoolObject,
          transaction.object(coinToStake),
          transaction.object(operatorObject.data.objectId),
        ],
      });
      await transaction.transferObjects([stakedCoin], this.address);
      await this.executeTx(transaction);
    } catch (error) {
      if (error.message && error.message.includes("equivocated")) {
        await Helper.delay(1000, this.acc, error.message, this);
      }
      throw error;
    }
  }


  async exSuiToWal() {
    try {
      await Helper.delay(1000, this.acc, "Đang trao đổi SUI → WAL", this);
      const amount =
        Number(Helper.randomFloat(Config.TXAMOUNTMIN, Config.TXAMOUNTMAX)) *
        Number(MIST_PER_SUI);
      const exchangeObject = await this.client.getObject({
        id: this.walrusExchangeObjectId,
        options: {
          showBcs: true,
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      const transaction = new Transaction();
      const sharedObject = transaction.sharedObjectRef({
        objectId: exchangeObject.data.objectId,
        initialSharedVersion:
          exchangeObject.data.owner.Shared.initial_shared_version,
        mutable: true,
      });
      const coinToExchange = await transaction.splitCoins(transaction.gas, [
        amount,
      ]);
      const exchangedCoin = transaction.moveCall({
        target: `${this.walrusAddress}::wal_exchange::exchange_all_for_wal`,
        arguments: [sharedObject, transaction.object(coinToExchange)],
      });
      await transaction.transferObjects([exchangedCoin], this.address);
      await this.executeTx(transaction);
    } catch (error) {
      throw error;
    }
  }

  async getBalance(showLogs = false) {
    try {
      if (showLogs) {
        await Helper.delay(500, this.acc, "Đang lấy thông tin số dư...", this);
      }
      this.balance = await this.client.getAllBalances({
        owner: this.address,
      });
      this.balance = this.balance.map((balance) => {
        balance.totalBalance = parseFloat(
          (Number(balance.totalBalance) / Number(MIST_PER_SUI)).toFixed(2)
        );
        return balance;
      });
      if (showLogs) {
        await Helper.delay(
          1000,
          this.acc,
          "Lấy thành công số dư",
          this
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async executeTx(transaction) {
    try {
      await Helper.delay(1000, this.acc, "Đang thực thi giao dịch ...", this);
      const result = await this.client.signAndExecuteTransaction({
        signer: this.wallet,
        transaction: transaction,
      });
      await Helper.delay(
        3000,
        this.acc,
        `Giao dịch đã thực thi : ${result.digest}`,
        this
      );
      await this.getBalance();
    } catch (error) {
      throw error;
    }
  }
}
