import React from "react";
import { Button, Flex } from "theme-ui";

import {
  Decimal,
  Decimalish,
  LiquityStoreState,
  LQTYStake,
  LQTYStakeChange
} from "@liquity/lib-base";

import { LiquityStoreUpdate, useLiquityReducer, useLiquitySelector } from "@liquity/lib-react";

import { GT, COIN } from "../../strings";

import { useStakingView } from "./context/StakingViewContext";
import { StakingEditor } from "./StakingEditor";
import { StakingManagerAction } from "./StakingManagerAction";
import { ActionDescription, Amount } from "../ActionDescription";
import { ErrorDescription } from "../ErrorDescription";


//this is the code I created to get this to work
const init = ({ lqtyStake }: LiquityStoreState) => ({
  originalStake: lqtyStake,
  editedLQTY: lqtyStake.stakedLQTY,
  rawLQTY: lqtyStake.stakedLQTY, // new field
});

// type StakeManagerState = ReturnType<typeof init>;

type StakeManagerState = {
  originalStake: LQTYStake;
  editedLQTY: Decimal;
  rawLQTY: Decimal; // new field
};

export type StakeManagerAction =
  | LiquityStoreUpdate
  | { type: "revert" }
  | { type: "setStake"; newValue: Decimalish; displayValue: Decimalish };
  // | { type: "setStake"; newValue: Decimalish };

const reduce = (state: StakeManagerState, action: StakeManagerAction): StakeManagerState => {
  // console.log(state);
  // console.log(action);

  const { originalStake, editedLQTY } = state;

  switch (action.type) {
    // case "setStake":
      // updated code here
      // return { ...state, editedLQTY: Decimal.from(action.newValue) };
      // return { ...state, rawLQTY: Decimal.from(action.newValue), editedLQTY: Decimal.from(action.displayValue) };

    case "setStake":
      const rawLQTY = Decimal.from(action.newValue);
      const editedLQTY = Decimal.from(action.displayValue);
      return { ...state, rawLQTY, editedLQTY };

    case "revert":
      return { ...state, editedLQTY: originalStake.stakedLQTY };

    case "updateStore": {
      const {
        stateChange: { lqtyStake: updatedStake }
      } = action;


      //this is the code I created to get this to work
      if (updatedStake) {
        return {
          // originalStake: updatedStake,
          // editedLQTY: updatedStake.apply(originalStake.whatChanged(editedLQTY))
          originalStake: updatedStake,
          editedLQTY: updatedStake.stakedLQTY,
          rawLQTY: state.rawLQTY
        };
      }
    }
  }

  return state;
};

const selectLQTYBalance = ({ lqtyBalance }: LiquityStoreState) => lqtyBalance;

type StakingManagerActionDescriptionProps = {
  originalStake: LQTYStake;
  change: LQTYStakeChange<Decimal>;
};

const StakingManagerActionDescription: React.FC<StakingManagerActionDescriptionProps> = ({
  originalStake,
  change
}) => {
  const stakeLQTY = change.stakeLQTY?.prettify().concat(" ", GT);
  const unstakeLQTY = change.unstakeLQTY?.prettify().concat(" ", GT);
  const collateralGain = originalStake.collateralGain.nonZero?.prettify(4).concat(" BNB");
  const lusdGain = originalStake.lusdGain.nonZero?.prettify().concat(" ", COIN);

  if (originalStake.isEmpty && stakeLQTY) {
    return (
      <ActionDescription>
        You are staking <Amount>{stakeLQTY}</Amount>.
      </ActionDescription>
    );
  }

  return (
    <ActionDescription>
      {stakeLQTY && (
        <>
          You are adding <Amount>{stakeLQTY}</Amount> to your stake
        </>
      )}
      {unstakeLQTY && (
        <>
          You are withdrawing <Amount>{unstakeLQTY}</Amount> to your wallet
        </>
      )}
      {(collateralGain || lusdGain) && (
        <>
          {" "}
          and claiming{" "}
          {collateralGain && lusdGain ? (
            <>
              <Amount>{collateralGain}</Amount> and <Amount>{lusdGain}</Amount>
            </>
          ) : (
            <>
              <Amount>{collateralGain ?? lusdGain}</Amount>
            </>
          )}
        </>
      )}
      .
    </ActionDescription>
  );
};

export const StakingManager: React.FC = () => {
  const { dispatch: dispatchStakingViewAction } = useStakingView();
  const [{ originalStake, editedLQTY }, dispatch] = useLiquityReducer(reduce, init);
  const lqtyBalance = useLiquitySelector(selectLQTYBalance);

  const change = originalStake.whatChanged(editedLQTY);
  const [validChange, description] = !change
    ? [undefined, undefined]
    : change.stakeLQTY?.gt(lqtyBalance)
    ? [
        undefined,
        <ErrorDescription>
          The amount you're trying to stake exceeds your balance by{" "}
          <Amount>
            {change.stakeLQTY.sub(lqtyBalance).prettify()} {GT}
          </Amount>
          .
        </ErrorDescription>
      ]
    : [change, <StakingManagerActionDescription originalStake={originalStake} change={change} />];

  const makingNewStake = originalStake.isEmpty;

  return (
    <StakingEditor title={"Staking"} {...{ originalStake, editedLQTY, dispatch }}>
      {description ??
        (makingNewStake ? (
          <ActionDescription>Enter the amount of {GT} you'd like to stake.</ActionDescription>
        ) : (
          <ActionDescription>Adjust the {GT} amount to stake or withdraw.</ActionDescription>
        ))}

      <Flex variant="layout.actions">
        <Button
          variant="cancel"
          onClick={() => dispatchStakingViewAction({ type: "cancelAdjusting" })}
        >
          Cancel
        </Button>

        {validChange ? (
          <StakingManagerAction change={validChange}>Confirm</StakingManagerAction>
        ) : (
          <Button disabled>Confirm</Button>
        )}
      </Flex>
    </StakingEditor>
  );
};
