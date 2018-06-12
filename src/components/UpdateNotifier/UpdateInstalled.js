// @flow

import { PureComponent } from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import semver from 'semver'

import { openModal } from 'reducers/modals'
import { lastUsedVersionSelector } from 'reducers/settings'
import { saveSettings } from 'actions/settings'
import { MODAL_RELEASES_NOTES } from 'config/constants'

import type { State } from 'reducers'

type Props = {
  openModal: Function,
  saveSettings: Function,
  lastUsedVersion: string,
}

const mapStateToProps = (state: State) => ({
  lastUsedVersion: lastUsedVersionSelector(state),
})

const mapDispatchToProps = {
  openModal,
  saveSettings,
}

class UpdateInstalled extends PureComponent<Props> {
  componentDidMount() {
    const { lastUsedVersion, saveSettings } = this.props
    const currentVersion = __APP_VERSION__

    // if (semver.gt(currentVersion, lastUsedVersion)) {
    axios
      .get(
        `https://api.github.com/repos/LedgerHQ/ledger-live-desktop/releases/tags/v${currentVersion}`,
      )
      .then(this.showModal)

    saveSettings({ lastUsedVersion: currentVersion })
    // }
  }

  showModal = ({ data }) => {
    const { openModal } = this.props

    openModal(MODAL_RELEASES_NOTES, data)
  }

  render() {
    return null
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UpdateInstalled)
