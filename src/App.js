import React, { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import { ethers } from "ethers";
import contractABI from "./utils/contractABI.json";
import ethLogo from "./assets/ethlogo.png";
import { networks } from "./utils/networks";
var bigInt = require("big-integer");

const TWITTER_HANDLE = "SanketKogekar";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = "0xB1BDc64E9AAF84A20BafB01E05229231f34B8d81";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [tokenCount, setTokenCount] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [network, setNetwork] = useState("");
  const [loading, setLoading] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState("");

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  window.ethereum.on("accountsChanged", async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  });

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }

    const chainId = await ethereum.request({ method: "eth_chainId" });
    setNetwork(networks[chainId]);

    ethereum.on("chainChanged", handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const mintTokens = async () => {
    console.log("Minting starts!");
    setLoading(true);
    if (!tokenCount) {
      console.log("Please enter a valid amount!");
      return;
    }

    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI.abi,
          signer
        );

        console.log("Popping your wallet to pay gas!");
        let tx = await contract.mint(tokenCount);

        const receipt = await tx.wait();

        if (receipt.status === 1) {
          console.log(
            "Minted Tokens! https://testnet.bscscan.com/tx/" + tx.hash
          );

          setTimeout(() => {
            fetchTotalSupply();
          }, 2000);

          setTokenCount("");
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const renderTotalSupply = () => {
    if (totalSupply) {
      var supply = new bigInt(totalSupply, 10);
      return (
        <div className="mint-container">
          <p className="subtitle">Total Token Supply: {supply.toString()}</p>
          {!!ownerAddress && (
            <>
              <p className="owner">Token Creator: {ownerAddress}</p>
              <br />
              <p className="note">
                (Only the token creator can mint more tokens!)
              </p>
            </>
          )}
        </div>
      );
    }
  };

  const fetchTotalSupply = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI.abi,
          signer
        );
        const totalSupply = await contract.totalSupply();
        setTotalSupply(totalSupply);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchTokenOwner = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI.abi,
          signer
        );

        const owner = await contract.owner();
        setOwnerAddress(owner);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (network === "BSC Testnet") {
      fetchTotalSupply();
      fetchTokenOwner();
    }
  }, [currentAccount, network]);

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x61" }], // Check networks.js for hexadecimal network ids
        });
      } catch (error) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x61",
                  chainName: "BSC Testnet",
                  rpcUrls: ["https://data-seed-prebsc-1-s2.binance.org:8545/"],
                  nativeCurrency: {
                    name: "Test BNB",
                    symbol: "tBNB",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://testnet.bscscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const renderNotConnectedContainer = () => (
    <div className="connect-wallet-container">
      <img
        src="https://media.giphy.com/media/nIoUgc3KW2BF5rxVj2/giphy.gif"
        alt="Eth Gif"
      />
      <button
        onClick={connectWallet}
        className="cta-button connect-wallet-button"
      >
        Connect Wallet
      </button>
    </div>
  );

  const renderInputForm = () => {
    if (network !== "BSC Testnet") {
      return (
        <div className="connect-wallet-container">
          <h2>Please switch to BSC Testnet</h2>
          <button className="cta-button mint-button" onClick={switchNetwork}>
            Click here to switch
          </button>
        </div>
      );
    }

    return (
      <div className="form-container">
        <div className="first-row">
          <input
            type="text"
            value={tokenCount}
            placeholder="Enter amount of tokens"
            onChange={(e) => setTokenCount(e.target.value)}
          />
        </div>

        <button
          className="cta-button mint-button"
          disabled={loading}
          onClick={mintTokens}
        >
          Mint ReadyToPlay (RTP) Tokens!
        </button>
      </div>
    );
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <p className="title">Mint RTP (BEP20) Tokens</p>
              <p className="subtitle">Increase supply with a single click!</p>
            </div>
            {/* Display a logo and wallet connection status*/}
            <div className="right">
              <img alt="Network logo" className="logo" src={ethLogo} />
              {currentAccount ? (
                <p>
                  {" "}
                  Wallet: {currentAccount.slice(0, 6)}...
                  {currentAccount.slice(-4)}{" "}
                </p>
              ) : (
                <p> Not connected </p>
              )}
            </div>
          </header>
        </div>

        {!currentAccount && renderNotConnectedContainer()}
        {/* Render the input form if an account is connected */}
        {currentAccount && renderInputForm()}
        {totalSupply && renderTotalSupply()}

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Made By @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
