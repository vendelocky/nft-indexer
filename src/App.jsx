import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { useState } from 'react';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const connectToWallet = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(result => {
          // use a default account (first account)
          getNFTsForOwner(result[0]);
        })
    }
  };

  const getNFTsForOwner = async (walletAddress) => {
    setResults([]);
    setHasQueried(false);
    setIsLoading(true);
    setErrMsg('');

    const config = {
      apiKey: '', // Enter your Alchemy API Key
      network: Network.ETH_SEPOLIA,
    };

    const alchemy = new Alchemy(config);
    let data = null;

    try {
      data = await alchemy.nft.getNftsForOwner(walletAddress);
      setResults(data);
      const tokenDataPromises = [];
      if (data) {
        for (let i = 0; i < data.ownedNfts.length; i++) {
          const tokenData = alchemy.nft.getNftMetadata(
            data.ownedNfts[i].contract.address,
            data.ownedNfts[i].tokenId,
            'ERC721'
          );
          tokenDataPromises.push(tokenData);
        }
        console.log(tokenDataPromises);
        setTokenDataObjects(await Promise.all(tokenDataPromises));
      }
    } catch (e) {
      setErrMsg(e.message);
    }

    setHasQueried(true);
    setIsLoading(false);
  }
  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>
            Plug in an address and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
          placeholder={'e.g. 0xF6cf78f4C816f08e884aFB6Bd6f462a26430f689'}
        />
        <Button fontSize={20} onClick={connectToWallet} mt={36} bgColor="blue">
          Connect my wallet
        </Button>
        <Button style={{ marginBottom: 20 }} fontSize={20} onClick={() => getNFTsForOwner(userAddress)} mt={36} bgColor="blue">
          Fetch NFTs from Address
        </Button>
        {hasQueried ? (
          <>
            {results?.totalCount > 0 && (<Heading my={36}>Here are your NFTs:</Heading>)}
            <SimpleGrid w={'90vw'} columns={4} spacing={24}>
              {results?.ownedNfts?.map((e, i) => {
                return (
                  <Flex
                    flexDir={'column'}
                    color="white"
                    bg="blue"
                    w={'20vw'}
                    key={e.id}
                  >
                    <Box style={{ paddingLeft: 6 }}>
                      <b>Name:</b>{' '}
                      {tokenDataObjects[i].title?.length === 0
                        ? 'No Name'
                        : tokenDataObjects[i].title}
                    </Box>
                    <Image
                      src={
                        tokenDataObjects[i]?.rawMetadata?.image ??
                        'https://via.placeholder.com/200'
                      }
                      alt={'Image'}
                    />
                    <Box style={{ paddingLeft: 6 }}>
                      <Text>{tokenDataObjects[i]?.description}</Text>
                    </Box>
                    {tokenDataObjects[i]?.rawMetadata?.attributes?.map((attr, i) => {
                      return (
                        <Box style={{ paddingLeft: 6 }}>
                          <Text>{`${attr.trait_type} - ${attr.value}`}</Text>
                        </Box>
                      );
                    })}
                  </Flex>
                );
              })}
            </SimpleGrid>
          </>
        ) : !isLoading ? (
          'Please make a query! This may take a few seconds...'
        ) : ('Loading the NFTs...')}
        {!!errMsg && (<Text>ERROR {errMsg}</Text>)}
        {hasQueried && results?.totalCount == 0 && !errMsg && (<Text>No NFT found from the inputted address above!</Text>)}
      </Flex>
    </Box>
  );
}

export default App;
