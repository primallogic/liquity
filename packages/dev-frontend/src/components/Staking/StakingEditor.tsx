import React, { useState } from "react";
import { Heading, Box, Card, Button } from "theme-ui";

import { Decimal, Decimalish, Difference, LiquityStoreState, LQTYStake } from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { COIN, GT } from "../../strings";

import { Icon } from "../Icon";
import { EditableRow, StaticRow } from "../Trove/Editor";
import { LoadingOverlay } from "../LoadingOverlay";

import { useStakingView } from "./context/StakingViewContext";
import { StakeManagerAction } from "./StakingManager";

const select = ({ lqtyBalance, totalStakedLQTY }: LiquityStoreState) => ({
  lqtyBalance,
  totalStakedLQTY
});

type StakingEditorProps = {
  title: string;
  originalStake: LQTYStake;
  editedLQTY: Decimal;
  // dispatch: (action: { type: "setStake"; newValue: Decimalish } | { type: "revert" }) => void;
  dispatch: (action: StakeManagerAction) => void;
};

export const StakingEditor: React.FC<StakingEditorProps> = ({
  children,
  title,
  originalStake,
  editedLQTY,
  dispatch
}) => {
  const { lqtyBalance, totalStakedLQTY } = useLiquitySelector(select);
  const { changePending } = useStakingView();
  const editingState = useState<string>();

  const edited = !editedLQTY.eq(originalStake.stakedLQTY);

  const maxAmount = originalStake.stakedLQTY.add(lqtyBalance);
  const maxedOut = editedLQTY.eq(maxAmount);

  const totalStakedLQTYAfterChange = totalStakedLQTY.sub(originalStake.stakedLQTY).add(editedLQTY);

  const originalPoolShare = originalStake.stakedLQTY.mulDiv(100, totalStakedLQTY);
  const newPoolShare = editedLQTY.mulDiv(100, totalStakedLQTYAfterChange);
  const poolShareChange =
    originalStake.stakedLQTY.nonZero && Difference.between(newPoolShare, originalPoolShare).nonZero;

  return (
    <Card>
      <Heading>
        {title}
        {edited && !changePending && (
          <Button
            variant="titleIcon"
            sx={{ ":enabled:hover": { color: "danger" } }}
            onClick={() => dispatch({ type: "revert" })}
          >
            <Icon name="history" size="lg" />
          </Button>
        )}
      </Heading>

      <Box sx={{ p: [2, 3] }}>
        <EditableRow
          label="Stake"
          inputId="stake-lqty"
          amount={editedLQTY.prettify()}
          maxAmount={maxAmount.toString()}
          maxedOut={maxedOut}
          unit={GT}
          {...{ editingState }}
          editedAmount={editedLQTY.toString(2)}
          // setEditedAmount={newValue => dispatch({ type: "setStake", newValue })}
          // edited code update here
          
          // setEditedAmount={newValue => {
          //   const reducedValue = Decimal.from(newValue).mul(0.95);
          //   dispatch({ type: "setStake", newValue: reducedValue.toString() });
          // }}

          // setEditedAmount={rawValue => {
          //   // Calculate the post-fee value
          //   const postFeeValue = Decimal.from(rawValue).mul(0.95).toString(2);
            
          //   // Store both the raw value and the post-fee value
          //   dispatch({ type: "setStake", newValue: rawValue, displayValue: postFeeValue });
          // }}
          
          //this is the code I created to get this to work
          setEditedAmount={rawValue => {
            const postFeeValue = Decimal.from(rawValue).mul(0.95).toString(2);
            dispatch({ type: "setStake", newValue: rawValue, displayValue: postFeeValue });
          }}
          
        />

        {newPoolShare.infinite ? (
          <StaticRow label="Pool share" inputId="stake-share" amount="N/A" />
        ) : (
          <StaticRow
            label="Pool share"
            inputId="stake-share"
            amount={newPoolShare.prettify(4)}
            pendingAmount={poolShareChange?.prettify(4).concat("%")}
            pendingColor={poolShareChange?.positive ? "success" : "danger"}
            unit="%"
          />
        )}

        {!originalStake.isEmpty && (
          <>
            <StaticRow
              label="Redemption gain"
              inputId="stake-gain-eth"
              amount={originalStake.collateralGain.prettify(4)}
              color={originalStake.collateralGain.nonZero && "success"}
              unit="BNB"
            />

            <StaticRow
              label="Issuance gain"
              inputId="stake-gain-lusd"
              amount={originalStake.lusdGain.prettify()}
              color={originalStake.lusdGain.nonZero && "success"}
              unit={COIN}
            />
          </>
        )}

        {children}
      </Box>

      {changePending && <LoadingOverlay />}
    </Card>
  );
};
