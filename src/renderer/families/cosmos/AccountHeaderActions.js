// @flow
import React, { useCallback } from "react";
import invariant from "invariant";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box/Box";
import IconChartLine from "~/renderer/icons/ChartLine";

const ButtonBase: ThemedComponent<*> = styled(Button)`
  height: 34px;
  padding-top: 0;
  padding-bottom: 0;
`;

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);

  const { cosmosResources, spendableBalance } = mainAccount;
  invariant(cosmosResources, "cosmos account expected");
  const { delegations } = cosmosResources;

  const earnRewardDisabled = spendableBalance.isZero();
  const onClick = useCallback(() => {
    /** @TODO open first step of delegation flow */
    // dispatch(
    //   openModal("MODAL_COSMOS_DELEGATION_INFO", {
    //     parentAccount,
    //     account,
    //   }),
    // );
  }, []);

  if (parentAccount || delegations.length > 0) return null;

  return (
    <ButtonBase primary disabled={earnRewardDisabled} onClick={onClick}>
      <Box horizontal flow={1} alignItems="center">
        <IconChartLine size={12} />
        <Box fontSize={3}>
          <Trans i18nKey="delegation.title" />
        </Box>
      </Box>
    </ButtonBase>
  );
};

export default AccountHeaderActions;
