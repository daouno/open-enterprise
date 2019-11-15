import {
  ETH_DECIMALS,
  ETH_DECIMALS_NUMBER,
  RECURRING_DIVIDEND,
  PENDING,
  READY,
  CLAIMED,
} from './constants'
import BigNumber from 'bignumber.js'
import { IconCheck, IconCircleCheck, IconClock } from '@aragon/ui'
import React from 'react'

export const displayCurrency = (amount, decimalsNumber=ETH_DECIMALS_NUMBER) => {
  const decimals = BigNumber(10).pow(decimalsNumber)
  return BigNumber(amount).div(decimals).dp(3).toString()
}
export const toWei = amount => {
  return BigNumber(amount).times(ETH_DECIMALS).toNumber()
}

const PendingStatus = (theme) => (
  <div style={{ display: 'flex' }}>
    <IconClock style={{
      marginRight: '4px',
      marginTop: '-2px',
      color: theme.warning,
    }}/>
    Pending
  </div>
)

const ReadyStatus = (theme) => (
  <div style={{ display: 'flex' }}>
    <IconCheck style={{
      marginRight: '4px',
      marginTop: '-2px',
      color: theme.positive,
    }}/>
    Ready to claim
  </div>
)

const ClaimedStatus = (theme) => (
  <div style={{ display: 'flex' }}>
    <IconCircleCheck style={{
      marginRight: '4px',
      marginTop: '-2px',
      color: theme.positive,
    }}/>
    Claimed
  </div>
)

export const getStatusId = ({
  rewardType,
  timeClaimed,
  endDate,
  claims,
  disbursements,
}) => {
  if (rewardType === RECURRING_DIVIDEND)
    return claims === disbursements.length ? CLAIMED : (
      Date.now() > disbursements[claims].getTime() ? READY : PENDING
    )
  else return timeClaimed > 0 ? CLAIMED : (
    Date.now() > endDate ? READY : PENDING
  )
}

export const getStatus = (reward, theme) => {
  const statusId = getStatusId(reward)
  switch(statusId) {
  case PENDING:
    return PendingStatus(theme)
  case READY:
    return ReadyStatus(theme)
  case CLAIMED:
    return ClaimedStatus(theme)
  }
}
