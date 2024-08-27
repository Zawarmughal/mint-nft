import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import { abi } from '../ABI/abi'

// Replace with your smart contract's ABI and address
const contractABI = abi
const contractAddress = process.env.REACT_APP_SMART_CONTRACT_ADDRESS

export default function MintingSetup() {
    const [web3, setWeb3] = useState(null)
    const [accounts, setAccounts] = useState([])
    const [contract, setContract] = useState(null)
    // const [ipfsLink, setIpfsLink] = useState('https://ipfs.io/ipfs/Qmew5exEZC9UH2fusrbjxxZZ7E6BB2YLxJ1aPt6aemTXp2');
    const [ipfsLink, setIpfsLink] = useState(
        'https://ipfs.io/ipfs/Qme3VJ2GVvGxpZFDyjv3RKMnAkA1V75fQDpuEjDzEvfsdg'
    )
    // const [ipfsLink, setIpfsLink] = useState('https://ipfs.io/ipfs/QmWhv89aeLUAhk27FV1Jdg8qeroJHxk35kUriNwJGBkCvo');
    const [minting, setMinting] = useState(false)
    const [minted, setMinted] = useState(false)
    const [txHash, setTxHash] = useState(null)
    const [error, setError] = useState(null)
    const [tokenId, setTokenId] = useState(null)
    const [tokenMetadata, setTokenMetadata] = useState(null)

    useEffect(() => {
        async function setupWeb3() {
            if (window.ethereum) {
                try {
                    // Request account access if needed
                    await window.ethereum.request({
                        method: 'eth_requestAccounts',
                    })
                    const web3Instance = new Web3(window.ethereum)
                    console.log('Web3Instance', web3Instance)
                    setWeb3(web3Instance)
                    const account = await web3Instance.eth.getAccounts()
                    setAccounts(account)
                    console.log('Accounts', account)

                    const deployedContract = new web3Instance.eth.Contract(
                        contractABI,
                        contractAddress
                    )
                    setContract(deployedContract)

                    // Listen for network changes
                    window.ethereum.on('chainChanged', async (chainId) => {
                        // Reload the page to reset the dapp to the correct network
                        window.location.reload()
                    })
                } catch (error) {
                    console.error(
                        'Error connecting to Ethereum provider:',
                        error
                    )
                }
            } else {
                console.error(
                    'Please install MetaMask or another Ethereum provider extension.'
                )
            }
        }

        setupWeb3()
    }, [])

    const handleMint = async () => {
        if (!web3 || !contract || accounts.length === 0) {
            console.error(
                'Web3 or contract not initialized or no accounts available.'
            )
            return
        }

        setMinting(true)
        try {
            const tx = await contract.methods
                .mintNFT(accounts[0], ipfsLink)
                .send({ from: accounts[0] })
            setTxHash(tx.transactionHash)

            // Extract token ID from transaction logs
            const receipt = await web3.eth.getTransactionReceipt(
                tx.transactionHash
            )
            const transferEvent = receipt.logs.find(
                (log) =>
                    log.topics[0] ===
                    web3.utils.sha3('Transfer(address,address,uint256)')
            )
            // if (transferEvent) {
            const tokenId = web3.utils.toBN(transferEvent.topics[3]).toString()
            console.log('TokenId:', tokenId)
            setTokenId(tokenId)

            // Fetch token URI
            const tokenURI = await contract.methods.tokenURI(tokenId).call()
            setIpfsLink(tokenURI)

            // Fetch metadata from IPFS
            // const response = await fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
            const response = await fetch(tokenURI)
            const metadata = await response.json()
            setTokenMetadata(metadata)
            // } else {
            // console.error('Transfer event not found in transaction receipt.');
            // }

            setMinted(true)
        } catch (error) {
            setError(error.message || error.toString())
            console.error('Error minting NFT:', error)
        } finally {
            setMinting(false)
        }
    }

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Mint Your NFT</h1>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            <p>
                IPFS Link:{' '}
                <a href={ipfsLink} target="_blank" rel="noopener noreferrer">
                    {ipfsLink}
                </a>
            </p>
            <button
                onClick={handleMint}
                style={{ padding: '10px 20px', fontSize: '16px' }}
                disabled={minting || minted}
            >
                {minting ? 'Minting...' : minted ? 'Minted' : 'Mint'}
            </button>
            {txHash && (
                <p>
                    Transaction Hash:{' '}
                    <a
                        href={`https://etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {txHash}
                    </a>
                </p>
            )}
            {/* {tokenId && ( */}
            <div>
                <h3>Token ID: {tokenId}</h3>
                {/* {tokenMetadata && ( */}
                <div>
                    <p>Name: {tokenMetadata?.name}</p>
                    <p>Description: {tokenMetadata?.description}</p>
                    <p>
                        Image:{' '}
                        <img
                            src={tokenMetadata?.image.replace(
                                'ipfs://',
                                'https://ipfs.io/ipfs/'
                            )}
                            alt="NFT"
                            style={{ maxWidth: '300px' }}
                        />
                    </p>
                </div>
                {/* )} */}
            </div>
            {/* )} */}
        </div>
    )
}
