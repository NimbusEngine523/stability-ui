type TOptions = {
  address: string;
  decimals: string | number;
  symbol: string;
  image?: string;
};

export const addAssetToWallet = async (
  client: any,
  address: string,
  decimals: number,
  symbol: string,
  image?: string
) => {
  try {
    const options: TOptions = {
      address: address,
      decimals: decimals,
      symbol: symbol,
    };

    if (image) {
      options.image = image;
    }
    console.log(client.data.watchAsset);
    const result = await client?.data.watchAsset({
      type: "ERC20",
      options: options,
    });
  } catch (error) {
    console.log("ADD ASSET ERROR:", error);
  }
};
