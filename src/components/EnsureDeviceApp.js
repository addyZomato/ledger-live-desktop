// @flow

import React, { Component } from 'react'
import invariant from 'invariant'
import { connect } from 'react-redux'
import { Trans } from 'react-i18next'
import type { Account, CryptoCurrency } from '@ledgerhq/live-common/lib/types'
import { getCryptoCurrencyIcon } from '@ledgerhq/live-common/lib/react'

import logger from 'logger'
import getAddress from 'commands/getAddress'
import { createCancelablePolling } from 'helpers/promise'
import { standardDerivation } from 'helpers/derivations'
import { isSegwitAccount } from 'helpers/bip32'
import { BtcUnmatchedApp } from 'helpers/getAddressForCurrency/btc'

import DeviceInteraction from 'components/DeviceInteraction'
import Text from 'components/base/Text'

import IconUsb from 'icons/Usb'

import type { Device } from 'types/common'

import { createCustomErrorClass } from 'helpers/errors'
import { getCurrentDevice } from 'reducers/devices'

export const WrongAppOpened = createCustomErrorClass('WrongAppOpened')
export const WrongDeviceForAccount = createCustomErrorClass('WrongDeviceForAccount')

const usbIcon = <IconUsb size={30} />
const Bold = props => <Text ff="Open Sans|Bold" {...props} />

const mapStateToProps = state => ({
  device: getCurrentDevice(state),
})

class EnsureDeviceApp extends Component<{
  device: ?Device,
  account?: ?Account,
  currency?: ?CryptoCurrency,
}> {
  connectInteractionHandler = () =>
    createCancelablePolling(() => {
      if (!this.props.device) return Promise.reject()
      return Promise.resolve(this.props.device)
    })

  openAppInteractionHandler = ({ device }) =>
    createCancelablePolling(
      async () => {
        const { account, currency: _currency } = this.props
        const currency = account ? account.currency : _currency
        invariant(currency, 'No currency given')
        const address = await getAddressFromAccountOrCurrency(device, account, currency)
        if (account) {
          const { freshAddress } = account
          if (account && freshAddress !== address) {
            logger.warn({ freshAddress, address })
            throw new WrongDeviceForAccount(`WrongDeviceForAccount ${account.name}`, {
              accountName: account.name,
            })
          }
        }
        return address
      },
      {
        shouldThrow: (err: Error) => {
          const isWrongApp = err instanceof BtcUnmatchedApp
          const isWrongDevice = err instanceof WrongDeviceForAccount
          return isWrongApp || isWrongDevice
        },
      },
    )

  renderOpenAppTitle = () => {
    const { account, currency } = this.props
    const cur = account ? account.currency : currency
    invariant(cur, 'No currency given')
    return (
      <Trans i18nKey="deviceConnect:step2.open" parent="div">
        {'Open the '}
        <strong>{cur.name}</strong>
        {' app on your device'}
      </Trans>
    )
  }

  render() {
    const { account, currency, ...props } = this.props
    const cur = account ? account.currency : currency
    const Icon = cur ? getCryptoCurrencyIcon(cur) : null
    return (
      <DeviceInteraction
        shouldRenderRetry
        steps={[
          {
            id: 'device',
            title: (
              <Trans i18nKey="app:deviceConnect.step1.connect" parent="div">
                {'Connect and unlock your '}
                <Bold>{'Ledger device'}</Bold>
              </Trans>
            ),
            icon: usbIcon,
            run: this.connectInteractionHandler,
          },
          {
            id: 'address',
            title: this.renderOpenAppTitle,
            icon: Icon ? <Icon size={30} /> : null,
            run: this.openAppInteractionHandler,
          },
        ]}
        {...props}
      />
    )
  }
}

async function getAddressFromAccountOrCurrency(device, account, currency) {
  const { address } = await getAddress
    .send({
      devicePath: device.path,
      currencyId: currency.id,
      path: account
        ? account.freshAddressPath
        : standardDerivation({ currency, segwit: false, x: 0 }),
      segwit: account ? isSegwitAccount(account) : false,
    })
    .toPromise()
  return address
}

export default connect(mapStateToProps)(EnsureDeviceApp)
