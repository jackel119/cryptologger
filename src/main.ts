import WebSocket from "ws";
import { PrismaClient } from "@prisma/client";
import moment from "moment";

const PAIRS = [
  "ETH/USD",
  "XMR/USD",
  "XBT/USD",
];

const throttleTable = Object.fromEntries(PAIRS.map(p => ([p, moment().subtract({ minutes: 1 })])));

function shouldExecute(pairSymbol: string) {

  if (throttleTable[pairSymbol].isBefore(moment().subtract({ seconds: 15 }))) {
    throttleTable[pairSymbol] = moment();
    return true;
  }

  return false;
}

const prisma = new PrismaClient();

async function main() {

  const ws = new WebSocket("wss://ws.kraken.com");

  ws.on("open", () => {
    console.log("Connected");

    ws.send(JSON.stringify({
      event: "subscribe",
      pair: PAIRS,
      subscription: {
        name: "ticker",
      },
    }));

    ws.on("message", async msg => {
      const data = JSON.parse(msg.toString());
      if (data.event === "heartbeat") return;
      if (Array.isArray(data)) {
        const [_, prices, type, pair] = data;

        if (!shouldExecute(pair)) return;

        const {
          a: ask,
          b: bid,
          c: close,
          v: volume,
          p: weightedAveragePrice,
          t: noOfTrades,
          l: low,
          h: high,
        } = prices;

        const [bestAskPrice, wholeLotVolumeAsk, lotVolumeAsk] = ask;
        const [bestBidPrice, wholeLotVolumeBid, lotVolumeBid] = bid;
        const [closePrice, lotVolumeClose] = close;
        const [volumeToday, volume24Hrs] = volume;
        const [weightedToday, weighted24Hrs] = weightedAveragePrice;


        const obj = {
          ts: new Date(),
          pair,
          ask: {
            best: parseFloat(bestAskPrice),
            lotVolume: parseFloat(lotVolumeAsk),
            wholeLotVolume: parseFloat(wholeLotVolumeAsk),
          },
          bid: {
            best: parseFloat(bestBidPrice),
            lotVolume: parseFloat(lotVolumeBid),
            wholeLotVolume: parseFloat(wholeLotVolumeBid),
          },
          weightedAverage: parseFloat(weighted24Hrs),
          volume: parseFloat(volume24Hrs),
        };

        try {

        await prisma.pricePoint.create({
          data: {
            asset1: pair.split('/')[0] as string,
            asset2: pair.split('/')[1] as string,
            ask: obj.ask.best,
            askVolume: obj.ask.lotVolume,
            bid: obj.bid.best,
            bidVolume: obj.bid.lotVolume,
            volume24Hrs: obj.volume,
            weightedAverage24Hrs: obj.weightedAverage,
          }
        });
        } catch (err) {
          console.error(err);
        }
        console.log(obj);

      } else {
        console.log(data);
      }
    })
  });

}

main();
