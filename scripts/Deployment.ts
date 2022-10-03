// ethers is much more lightweight to use in production than hardhat
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { Ballot__factory } from "../typechain-types";
import { sensitiveHeaders } from "http2";
dotenv.config();

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];
const selectedVoter = "0xAb762B43d1d914DEC5A4da1ad6278D7991d675d4";

function convertStringArrayToBytes32 (array:string[]){
    const bytes32Array = [];
    for (let index = 0; index < array.length; index ++){
      bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
    }
    return bytes32Array;
  }
  
// main function that is using everything in the global scope 
async function main() {
  const options = {
    infura: process.env.INFURA_API_KEY
  };   
  
  const provider = ethers.providers.getDefaultProvider("goerli", options);
  const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC ?? "");
  console.log(`Using address ${wallet.address}`);
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }

  console.log("Deploying Ballot contract");
  console.log("Proposals: ");
  PROPOSALS.forEach((element, index) => {
    console.log(`Proposal N. ${index + 1}: ${element}`);
  });


  // deployment of Ballot contract 
  const ballotFactory = new Ballot__factory(signer);
  const ballotContract = await ballotFactory.deploy(
    convertStringArrayToBytes32(PROPOSALS)
  );
  await ballotContract.deployed();
  
  
    // logging stuff in the console about proposals 
    for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        const name = ethers.utils.parseBytes32String(proposal.name);
        console.log({index, name, proposal});     
       }

   const chairperson = await ballotContract.chairperson();
   console.log({chairperson});
   
   // getting voterforaddress1 from the voters mapping by passing an address
   // declared with let as this will change
   let voterForAddress1 = await ballotContract.voters(selectedVoter);
   console.log({voterForAddress1});
   
  
  // for homework: Develop and Run Scripts For: 
  // voting rights, casting votes, delegating votes and querying results
 
  console.log("Giving Right to vote to selectedVoter");
   
  const giveRightToVoteTx = await ballotContract.giveRightToVote(
  selectedVoter);
  const giveRightToVoteTxReceipt = await giveRightToVoteTx.wait();
  console.log(giveRightToVoteTx);
  // updating voterforaddress1 after giveRighttoVote (changed weight)
  voterForAddress1 = await ballotContract.voters(selectedVoter);
  console.log({voterForAddress1});


  // Code doesn't work from this point forward...
  
  console.log("Delegating Votes")
  
  const addressTo = "0xAb762B43d1d914DEC5A4da1ad6278D7991d675d4 "; // insert who is getting delegated votes to them
  const delegateTx = await ballotContract.delegate(addressTo);
  const delegateTxReceipt = await delegateTx.wait(); 
  console.log(delegateTx);
  


  console.log("Casting Votes")
 
  const castVoteTx = await ballotContract.vote(PROPOSALS[0]);
  const castVoteTxRecipt = await castVoteTx.wait();
  console.log(castVoteTx);
  

  console.log("Query Results")

  const winner = await ballotContract.winningProposal();
  console.log(winner);

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 

