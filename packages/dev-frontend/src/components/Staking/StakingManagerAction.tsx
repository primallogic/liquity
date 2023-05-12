import { Button, get } from "theme-ui";

import { Decimal, LQTYStakeChange } from "@liquity/lib-base";

import { useLiquity } from "../../hooks/LiquityContext";
import { useTransactionFunction } from "../Transaction";
import { parseEther } from "ethers/lib/utils";

type StakingActionProps = {
  change: LQTYStakeChange<Decimal>;
};

export const StakingManagerAction: React.FC<StakingActionProps> = ({ change, children }) => {
  const { liquity, getApproval } = useLiquity();
  const [sendTransaction] = useTransactionFunction(
    "stake",
    change.stakeLQTY
      ? liquity.send.stakeLQTY.bind(liquity.send, change.stakeLQTY)
      : liquity.send.unstakeLQTY.bind(liquity.send, change.unstakeLQTY)
  );

  const approveAndSendTransaction =  async () => {
    if (change.stakeLQTY) {
      await getApproval(parseEther(change.stakeLQTY.toString()).toString())
    }
    sendTransaction()
  }

  return <Button onClick={approveAndSendTransaction}>{children}</Button>;
};
