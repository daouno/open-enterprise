import { Button, Header, IconPlus, Main, SyncIndicator, Tabs } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import throttle from 'lodash.throttle'
import { MyRewards, Overview } from '../Content'
import PanelManager, { PANELS } from '../Panel'
import styled from 'styled-components'
import { Empty } from '../Card'
import { networkContextType } from '../../../../../shared/ui'
import { useAragonApi } from '../../api-react'
import { IdentityProvider } from '../../../../../shared/identity'

const CONVERT_API_BASE = 'https://min-api.cryptocompare.com/data'
const CONVERT_THROTTLE_TIME = 5000

const convertApiUrl = symbols =>
  `${CONVERT_API_BASE}/price?fsym=USD&tsyms=${symbols.join(',')}`

class App extends React.Component {
  static propTypes = {
    api: PropTypes.object,
    rewards: PropTypes.arrayOf(PropTypes.object).isRequired,
    myRewards: PropTypes.arrayOf(PropTypes.object).isRequired,
    metrics: PropTypes.arrayOf(PropTypes.object).isRequired,
    myMetrics: PropTypes.arrayOf(PropTypes.object).isRequired,
    balances: PropTypes.arrayOf(PropTypes.object),
    isSyncing: PropTypes.bool.isRequired,
    network: PropTypes.object,
    userAccount: PropTypes.string.isRequired,
    connectedAccount: PropTypes.string.isRequired,
    displayMenuButton: PropTypes.bool.isRequired,
    refTokens: PropTypes.array.isRequired,
    amountTokens: PropTypes.array.isRequired,
    claims: PropTypes.array.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      selected: 0,
      tabs: [ 'Overview', 'My Rewards' ],
    }
    this.updateRewards()
  }

  static defaultProps = {
    network: {},
    claims: [],
    userAccount: '',
    refTokens: [],
    balances: [],
    isSyncing: true,
    rewards: [],
    myRewards: [],
    metrics: [],
    myMetrics: [],
    displayMenuButton: true,
    amountTokens: [],

  }

  static childContextTypes = {
    network: networkContextType,
  }

  getChildContext() {
    const { network } = this.props
    return {
      network: {
        type: network.type,
      },
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // do not re-render if the NewReward
    // panel is open
    if (this.state.panel && this.state.panel === nextState.panel) {
      return false
    }
    return true
  }

  componentDidUpdate(prevProps) {
    this.updateConvertedRates(this.props)
    if (prevProps.userAccount !== this.props.userAccount) {
      this.updateRewards()
    }
  }

  updateConvertedRates = throttle(async ({ balances = [] }) => {
    const verifiedSymbols = balances
      .filter(({ verified }) => verified)
      .map(({ symbol }) => symbol)

    if (!verifiedSymbols.length) {
      return
    }

    const res = await fetch(convertApiUrl(verifiedSymbols))
    const convertRates = await res.json()
    if (JSON.stringify(this.state.convertRates) !== JSON.stringify(convertRates)) {
      this.setState({ convertRates })
    }
  }, CONVERT_THROTTLE_TIME)

  updateRewards = async () => {
    this.props.api && this.props.api.emitTrigger('RefreshRewards', {
      userAddress: this.props.connectedAccount,
    })
  }

  handleMenuPanelOpen = () => {
    window.parent.postMessage(
      { from: 'app', name: 'menuPanel', value: true }, '*'
    )
  }

  closePanel = () => {
    this.setState({ panel: undefined, panelProps: undefined })
  }

  selectTab = idx => {
    this.setState({ selected: idx })
    this.updateRewards()
  }

  getRewards = (rewards) => {
    return rewards === undefined ? [] : rewards
  }

  newReward = () => {
    this.setState({
      panel: PANELS.NewReward,
      panelProps: {
        onNewReward: this.onNewReward,
        vaultBalance: '432.9 ETH',
        balances: this.props.balances,
        refTokens: this.props.refTokens,
        amountTokens: this.props.amountTokens,
        app: this.props.api,
        network: this.props.network,
        fundsLimit: this.props.fundsLimit,
      },
    })
  }

  onNewReward = async reward => {
    this.props.api.newReward(
      reward.description, //string _description
      reward.isMerit, //reward.isMerit, //bool _isMerit,
      reward.referenceAsset.key || reward.customToken.address, //address _referenceToken,
      reward.amountToken.address, //address _rewardToken,
      reward.amountWei.toString(10), //uint _amount,
      reward.startBlock, // uint _startBlock
      reward.duration, //uint _duration, (number of blocks until reward will be available)
      reward.occurrences, //uint _occurrences,
      0 //uint _delay
    ).toPromise()
    this.closePanel()
  }

  onClaimReward = reward => {
    this.props.api.claimReward(Number(reward.rewardId)).toPromise()
    this.closePanel()
  }

  myReward = reward => {
    this.setState({
      panel: PANELS.MyReward,
      panelProps: {
        onClaimReward: this.onClaimReward,
        onClosePanel: this.closePanel,
        reward,
        tokens: this.props.balances,
        viewReward: this.viewReward,
      },
    })
  }

  viewReward = reward => {
    this.setState({
      panel: PANELS.ViewReward,
      panelProps: reward,
    })
  }

  claimReward = reward => {
    // TODO
    this.props.api.claimReward(reward.rewardId + reward.claims).toPromise()
  }

  openDetailsView = reward => {
    this.viewReward(reward)
  }
  openDetailsMy = reward => {
    this.myReward(reward)
  }

  handleResolveLocalIdentity = address => {
    return this.props.api.resolveAddressIdentity(address).toPromise()
  }

  handleShowLocalIdentityModal = address => {
    return this.props.api
      .requestAddressIdentityModification(address)
      .toPromise()
  }

  render() {
    const Wrapper = ({ children }) => (
      <Main>
        <IdentityProvider
          onResolve={this.handleResolveLocalIdentity}
          onShowLocalIdentityModal={this.handleShowLocalIdentityModal}>
          { children }
          <PanelManager
            onClose={this.closePanel}
            activePanel={this.state.panel}
            {...this.state.panelProps}
          />
        </IdentityProvider>
      </Main>
    )

    const { rewards, myRewards, isSyncing } = this.props

    if (!rewards || !myRewards) return null
    else if (!rewards.length && !myRewards.length) {
      return (
        <Wrapper>
          <EmptyContainer>
            <Empty action={this.newReward} isSyncing={isSyncing} />
          </EmptyContainer>
        </Wrapper>
      )
    }
    return (
      <Wrapper>
        <Header
          primary="Rewards"
          secondary={
            <Button
              mode="strong"
              icon={<IconPlus />}
              onClick={this.newReward}
              label="New Reward"
            />
          }
        />
        <Tabs
          items={this.state.tabs}
          selected={this.state.selected}
          onChange={this.selectTab}
        />
        <SyncIndicator visible={isSyncing} />
        { this.state.selected === 1 ? (
          <MyRewards
            myRewards={this.props.myRewards}
            myMetrics={this.props.myMetrics}
            viewReward={this.viewReward}
            claimReward={this.claimReward}
          />
        ) : (
          <Overview
            rewards={this.props.rewards === undefined ? [] : this.props.rewards}
            newReward={this.newReward}
            viewReward={this.viewReward}
            metrics={this.props.metrics}
          />
        )}
      </Wrapper>
    )
  }
}

const EmptyContainer = styled.div`
  display: flex;
  height: 80vh;
  align-items: center;
`

// eslint-disable-next-line react/display-name
export default () => {
  const { api, appState, connectedAccount } = useAragonApi()
  return (
    <App
      api={api}
      rewards={appState.rewards}
      myRewards={appState.myRewards}
      metrics={appState.metrics}
      myMetrics={appState.myMetrics}
      amountTokens={appState.amountTokens}
      claims={appState.claims}
      {...appState}
      connectedAccount={connectedAccount}
    />
  )
}
