import { Button, get } from "theme-ui";

import { Decimal, LQTYStakeChange } from "@liquity/lib-base";

import { useLiquity } from "../../hooks/LiquityContext";
import { useTransactionFunction } from "../Transaction";
import { parseEther } from "ethers/lib/utils";

type StakingActionProps = {
  change: LQTYStakeChange<Decimal>;
};


// export const StakingManagerAction: React.FC<StakingActionProps> = ({ change, children }) => {
//   const { liquity, getApproval } = useLiquity();
//   const [sendTransaction] = useTransactionFunction(
//     "stake",
//     change.stakeLQTY
//       ? liquity.send.stakeLQTY.bind(liquity.send, change.stakeLQTY)
//       : liquity.send.unstakeLQTY.bind(liquity.send, change.unstakeLQTY)
//   );

// // original code here
//   // const approveAndSendTransaction =  async () => {
//   //   if (change.stakeLQTY) {
//   //     await getApproval(parseEther(change.stakeLQTY.toString()).toString())
//   //   }
//   //   sendTransaction()
//   // }

//   // return <Button onClick={approveAndSendTransaction}>{children}</Button>;

//   const approveAndSendTransaction =  async () => {
//     if (change.stakeLQTY) {
//       const rawLQTYForTransaction = Decimal.from(change.stakeLQTY); // Get rawLQTY from change.stakeLQTY
//       const fee = rawLQTYForTransaction.mul(0.05); // Calculate 5% fee
//       const amountToStake = rawLQTYForTransaction.sub(fee); // Subtract fee from rawLQTY

//       await getApproval(parseEther(amountToStake.toString()).toString())
//       sendTransaction()
//     } else {
//       // For unstaking, we don't need to subtract the fee
//       sendTransaction();
//     }
//   }

//     return <Button onClick={approveAndSendTransaction}>{children}</Button>;

export const StakingManagerAction: React.FC<StakingActionProps> = ({ change, children }) => {
  const { liquity, getApproval } = useLiquity();
  const [sendTransaction] = useTransactionFunction(
    "stake",
    change.stakeLQTY
      ? (amountToStake: Decimal) => liquity.send.stakeLQTY(amountToStake)
      : liquity.send.unstakeLQTY.bind(liquity.send, change.unstakeLQTY)
  );

  const approveAndSendTransaction =  async () => {
    if (change.stakeLQTY) {
      const rawLQTYForTransaction = Decimal.from(change.stakeLQTY); // Get rawLQTY from change.stakeLQTY
      const fee = rawLQTYForTransaction.mul(0.05); // Calculate 5% fee
      const amountToStake = rawLQTYForTransaction.sub(fee); // Subtract fee from rawLQTY

      await getApproval(parseEther(amountToStake.toString()).toString())
      sendTransaction(amountToStake)
    } else {
      // For unstaking, we don't need to subtract the fee
      sendTransaction(change.unstakeLQTY);
    }
  }

    return <Button onClick={approveAndSendTransaction}>{children}</Button>;

};



};
