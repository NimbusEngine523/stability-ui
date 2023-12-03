import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { formatUnits } from "viem";
import { vaults, publicClient, balances } from "@store";
import { PlatformABI, platform, ERC20ABI, IERC721Enumerable } from "@web3";
import type { TTPlatformData, TGitHubUser, TProfitTokenData } from "@types";
import { SDIV, PROFIT, PM } from "../../constants/tokens";
import { profitToken } from "../../utils/functions/profitTokenData";
import { sdivToken } from "../../utils/functions/sdivTokenData";

import axios from "axios";
import tokenlist from "../../stability.tokenlist.json";

function DAO() {
  const [_platformData, setPlatformData] = useState<TTPlatformData>();
  const [profitTokenData, setProfitTokenData] = useState<TProfitTokenData>();
  const [members, setMembers] = useState<TGitHubUser[]>([]);
  const [tokensTotalSupply, setTokensTotalSupply] = useState({
    pm: "",
    sdiv: "",
  });

  const $publicClient = useStore(publicClient);
  const $vaults = useStore(vaults);
  const $balances = useStore(balances);

  const getTeamData = async () => {
    try {
      const response = await axios.get(
        "https://api.github.com/orgs/stabilitydao/public_members"
      );

      setMembers(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Fetching getTeamData", error);
    }
  };

  const fetchPlatformData = async () => {
    if ($publicClient && $balances) {
      try {
        const platformVersion: any = await $publicClient.readContract({
          address: platform,
          abi: PlatformABI,
          functionName: "platformVersion",
        });

        const platformFees: any = await $publicClient.readContract({
          address: platform,
          abi: PlatformABI,
          functionName: "getFees",
        });

        const contractData: any = await $publicClient.readContract({
          address: platform,
          abi: PlatformABI,
          functionName: "getData",
        });

        const profitTotalSupply = await $publicClient.readContract({
          address: PROFIT[0] as `0x${string}`,
          abi: ERC20ABI,
          functionName: "totalSupply",
        });

        const _pmTotalSupply = await $publicClient.readContract({
          address: PM[0] as `0x${string}`,
          abi: IERC721Enumerable,
          functionName: "totalSupply",
        });

        const _sdivTotalSupply = await $publicClient.readContract({
          address: SDIV[0] as `0x${string}`,
          abi: ERC20ABI,
          functionName: "totalSupply",
        });

        const treasuryBalance = await $publicClient.readContract({
          address: PROFIT[0] as `0x${string}`,
          abi: ERC20ABI,
          functionName: "balanceOf",
          args: [PM[0] as `0x${string}`],
        });

        const multisigBalance = await $publicClient.readContract({
          address: PROFIT[0] as `0x${string}`,
          abi: ERC20ABI,
          functionName: "balanceOf",
          args: [contractData[0][6]],
        });

        //tvl
        const totalTvl: bigint = $vaults[6].reduce(
          (total: bigint, number: bigint) => total + number,
          BigInt(0)
        );
        const _totalTvl = formatUnits(totalTvl, 18);

        //profit Token
        const _profitTotalSupply = formatUnits(profitTotalSupply, 18);
        const _profitTokenPrice = Number(totalTvl) / Number(profitTotalSupply);
        const profitMarketCap =
          Number(_profitTokenPrice) * Number(_profitTotalSupply);

        const profitToken: TProfitTokenData = {
          price: _profitTokenPrice,
          totalSupply: _profitTotalSupply,
          marketCap: profitMarketCap,
        };

        setProfitTokenData(profitToken);

        //tokens total supply
        const _tokensTotalSupply = {
          pm: formatUnits(_pmTotalSupply, 18),
          sdiv: formatUnits(_sdivTotalSupply, 18),
        };
        setTokensTotalSupply(_tokensTotalSupply);

        //platformData

        const percentageFees: string[] = platformFees.map((fee: bigint) =>
          fee !== 0n ? (fee / 1000n).toString() + " %" : "0 %"
        );

        //treasury
        const _treasuryBalance = Number(
          formatUnits(treasuryBalance, 18)
        ).toFixed(2);

        //team
        const _multisig = Number(formatUnits(multisigBalance, 18)).toFixed(2);

        const platformData: TTPlatformData = {
          platformVersion: platformVersion,
          platformGovernance: contractData[0][5],
          multisig: contractData[0][6],
          multisigBalance: _multisig,
          numberOfTotalVaults: $balances[3].length,
          totalTvl: _totalTvl,
          strategieNames: contractData[6],
          platformFee: percentageFees[0],
          vaultManagerFee: percentageFees[1],
          strategyLogicFee: percentageFees[2],
          ecosystemFee: percentageFees[3],
          treasuryBalance: _treasuryBalance,
        };
        setPlatformData(platformData);
      } catch (error) {
        console.error("Error fetching platform data:", error);
      }
    }
  };

  useEffect(() => {
    getTeamData();
    fetchPlatformData();
  }, [$balances]);

  return (
    <main className="w-full m-auto">
      <div className="w-4/5 m-auto">
        <div className="m-auto p-2 bg-button rounded-md w-full">
          <h1 className="text-xxl text-gradient mb-3 text-left">Platform</h1>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-3 ">
            <div className="p-2 rounded-md text-left grid bg-[#1c1c23]">
              <div className="mb-3">
                <h2 className="font-bold">Version </h2>
                <h2 className="">{_platformData?.platformVersion}</h2>
              </div>
              <div className="mb-3">
                <h2 className=" font-bold">Total Vaults</h2>
                <h2>{_platformData?.numberOfTotalVaults}</h2>
              </div>
              <div>
                <h2 className="font-bold">Total TVL</h2>
                <h2>$ {_platformData?.totalTvl}</h2>
              </div>
            </div>

            <table className="p-2 rounded-md text-left grid bg-[#1c1c23]">
              <thead>
                <tr>
                  <th>Fees:</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="w-48">Platform fee:</td>
                  <td className="text-right">{_platformData?.platformFee}</td>
                </tr>
                <tr>
                  <td>Vault manager fee:</td>
                  <td className="text-right">
                    {_platformData?.vaultManagerFee}
                  </td>
                </tr>
                <tr>
                  <td>Strategy logic fee:</td>
                  <td className="text-right">
                    {_platformData?.strategyLogicFee}
                  </td>
                </tr>
                <tr>
                  <td>Ecosystem fee:</td>
                  <td className="text-right">{_platformData?.ecosystemFee}</td>
                </tr>
              </tbody>
            </table>

            <table className=" p-2 rounded-md text-left grid bg-[#1c1c23]">
              <thead>
                <tr>
                  <th className="text-left">Strategies:</th>
                </tr>
              </thead>
              <tbody className="grid">
                {Array.isArray(_platformData?.strategieNames) &&
                  _platformData?.strategieNames.map(
                    (strategyName: string, index: number) => (
                      <tr key={index}>
                        <td>{strategyName}</td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className=" m-auto w-4/5 mt-5 bg-button rounded-md">
        <div className="m-auto p-3 w-full">
          <h1 className="text-xxl text-gradient mb-3 text-left">Tokenomics</h1>

          {profitToken && (
            <div className=" bg-[#1c1c23] rounded-md p-3 mt-5 w-full ">
              <div className="flex bg-[#1c1c23] rounded-md mt-5 w-full justify-between">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td>Name: </td>
                      <td>{profitToken.name} </td>
                    </tr>
                    <tr>
                      <td>Symbol: </td>
                      <td>{profitToken.symbol} </td>
                    </tr>

                    <tr>
                      <td>Price: </td>
                      <td>
                        {"$ "}
                        {profitTokenData?.price}{" "}
                      </td>
                    </tr>
                    <tr>
                      <td>Total supply: </td>
                      <td>{profitTokenData?.totalSupply} </td>
                    </tr>
                    <tr>
                      <td>Market Cap: </td>
                      <td>{profitTokenData?.marketCap} </td>
                    </tr>
                    <tr>
                      <td>Address: </td>
                      <td>{profitToken.address} </td>
                    </tr>
                    <tr>
                      <td>Wallet: </td>
                      <td>
                        <span className="text-red-600">ADD WALLET</span>{" "}
                      </td>
                    </tr>
                    <tr>
                      <td>Staked: </td>
                      <td className="flex gap-3">
                        <span className="text-red-600 me-3 my-auto">
                          ADD STAKED
                        </span>{" "}
                        <div className="flex">
                          <button className="bg-button me-3 rounded-sm p-2 text-red-600">
                            Stake
                          </button>
                          <button className="bg-button me-3 rounded-sm p-2 text-red-600">
                            Unstake
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="w-52  ms-auto">
                  <img
                    className="rounded-full  ms-auto flex w-full"
                    src={profitToken.logoURI}
                    alt={profitToken.logoURI}
                  />
                </div>
              </div>

              <div className="flex gap-3  mt-3 justify-start">
                <a
                  className="rounded-sm text-start p-2 text-gray-400 bg-button "
                  href="https://dexscreener.com/polygon/0xd3B1f11f0ff29Add929941095C696D464D6961FC?embed=1&amp;theme=dark&amp;trades=0&amp;info=0">
                  Chart
                </a>
                <a
                  className="rounded-sm text-start p-2 text-gray-400 bg-button "
                  href="https://app.1inch.io/#/137/simple/swap/ETH/PROFIT">
                  Swap by 1inch
                </a>
                <a
                  className="rounded-sm text-start p-2 text-gray-400 bg-button "
                  href="https://app.uniswap.org/swap?inputCurrency=0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619&outputCurrency=0x48469a0481254d5945E7E56c1Eb9861429c02f44">
                  Swap by Uniswap V3
                </a>
              </div>
            </div>
          )}
          {sdivToken && (
            <div className="flex bg-[#1c1c23] rounded-md p-3 mt-5 w-full justify-between">
              <table className="w-full">
                <tbody className=" ">
                  <tr>
                    <td className="w-32">Name: </td>
                    <td>{sdivToken.name} </td>
                  </tr>
                  <tr>
                    <td>Symbol: </td>
                    <td>{sdivToken.symbol} </td>
                  </tr>
                  <tr>
                    <td>Address: </td>
                    <td>{sdivToken.address} </td>
                  </tr>
                  <tr>
                    <td>Total supply: </td>
                    <td>{tokensTotalSupply.sdiv} </td>
                  </tr>
                  <tr>
                    <td>Wallet: </td>
                    <td>
                      <span className="text-red-600">ADD WALLET</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Earned: </td>
                    <td className="gap-3 flex">
                      <span className="text-red-600 my-auto">ADD EARNED</span>
                      <button className="bg-button me-3 rounded-sm p-2 text-red-600">
                        Claim
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="w-52 ">
                <img
                  className="rounded-full  ms-auto flex w-full"
                  src={sdivToken.logoURI}
                  alt={sdivToken.logoURI}
                />
              </div>
            </div>
          )}

          <div className="m-auto  bg-[#1c1c23] rounded-md p-3 mt-5">
            <div className="flex bg-[#1c1c23] rounded-md mt-5 w-full justify-between">
              <table className="w-full">
                <tbody className=" w-full gap-3">
                  <tr>
                    <td className="w-32">Name: </td>
                    <td>Profit Maker </td>
                  </tr>
                  <tr>
                    <td>Symbol: </td>
                    <td>PM </td>
                  </tr>
                  <tr>
                    <td>Address: </td>
                    <td>0xAA3e3709C79a133e56C17a7ded87802adF23083B </td>
                  </tr>
                  <tr>
                    <td>Total supply: </td>
                    <td>{tokensTotalSupply.pm}</td>
                  </tr>
                  <tr>
                    <td>To mint: </td>
                    <td>
                      <span className="text-red-600 "> ADD TO MINT</span>{" "}
                    </td>
                  </tr>
                  <tr>
                    <td>Mint:</td>
                    <td>
                      <span className="text-red-600 ">ADD MINT</span>{" "}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="w-52  ms-auto ">
                <img
                  alt="Profit maker"
                  src="https://stabilitydao.org/pm.png"
                  className="rounded-full w-full  flex"
                />
              </div>
            </div>

            <div className="flex pt-3">
              <a
                className="rounded-sm text-start p-2 me-3 text-gray-400 bg-button"
                href="https://opensea.io/collection/profit-maker">
                Marketplace
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="  m-auto w-4/5 mt-5 bg-button rounded-md">
        <div className="p-3">
          <h1 className="text-xxl text-gradient mb-3 text-left">Governance</h1>
          <div className="p-3 bg-[#1c1c23] rounded-md">
            <table className="w-full">
              <thead>
                <tr>
                  <td>
                    <h2 className="text-start text-2xl py-4">Treasury</h2>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="w-32">Address:</td>
                  <td>0xC82676D6025bbA6Df3585d2450EF6D0eE9b8607E</td>
                </tr>
                <tr>
                  <td>Total balance: </td>
                  <td>{_platformData?.treasuryBalance}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#1c1c23] rounded-md mt-5">
            <table className="w-full">
              <thead>
                <tr>
                  <td>
                    <h2 className="text-start text-2xl py-4">Governance</h2>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="w-32">Address:</td>
                  <td>{_platformData?.platformGovernance}</td>
                </tr>
              </tbody>
            </table>
            <div className="flex mt-5">
              <a
                className="rounded-sm text-start p-2 me-3 text-gray-400 bg-button"
                href="https://www.tally.xyz/governance/eip155:137:0x6214Ba4Ce85C0A6F6025b0d63be7d65214463226">
                {" "}
                Tally governance app
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className=" m-auto w-4/5 mt-5 bg-button rounded-md">
        <div className="p-3">
          <h1 className="text-xxl text-gradient mb-3 text-left">Team</h1>
          <div className="p-3 bg-[#1c1c23] rounded-md">
            <table className="w-full">
              <thead>
                <tr>
                  <td>
                    <h2 className="text-start text-2xl py-4">Multisig</h2>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Address:</td>
                  <td>{_platformData?.multisig}</td>
                </tr>
                <tr>
                  <td>Total balance:</td>
                  <td>{_platformData?.treasuryBalance}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap   justify-center">
          {Array.isArray(members) ? (
            members.map(member => (
              <a
                href={member.html_url}
                key={member.id}
                className="p-2"
                target="_blank">
                <img
                  className="rounded-full m-auto mb-4 w-[80px]"
                  src={member.avatar_url}
                  alt={`Avatar de ${member.login}`}
                />
                <p className="font-bold">{member.login}</p>
              </a>
            ))
          ) : (
            <p>Loading team..</p>
          )}
        </div>
      </div>
    </main>
  );
}

export { DAO };
