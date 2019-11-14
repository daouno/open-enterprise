import {
  ETH_DECIMALS,
  ETH_DECIMALS_NUMBER,
  RECURRING_DIVIDEND,
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

export const getStatus = (
  { rewardType, timeClaimed, endDate, claims, disbursements },
  theme
) => {
  if (rewardType === RECURRING_DIVIDEND)
    return claims === disbursements.length ? ClaimedStatus(theme) : (
      Date.now() > disbursements[claims].getTime() ? ReadyStatus(theme) :
        PendingStatus(theme)
    )
  else return timeClaimed > 0 ? ClaimedStatus(theme) : (
    Date.now() > endDate ? ReadyStatus(theme) : PendingStatus(theme)
  )
}
