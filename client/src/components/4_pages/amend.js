/* eslint-disable sonarjs/cognitive-complexity */

/*
 * Page de détails d'un amendement
 * Le but de cette page est de permettre aux utilisateurs :
 * - d'accéder au détail d'un amendement
 * - TODO : de visualiser le vote de l'amendement
 * - TODO : de participer au vote sur l'amendement
 */

import React from 'react'
import {
  Amend,
  Box,
  Button,
  Buttons,
  Column,
  Columns,
  ErrorPage,
  Icon,
  Notification,
  Page,
  Results,
  UserContext,
  CountDown
} from '../../components'
import { Socket, Time } from '../../services'
import diff_match_patch from 'diff-match-patch'
import { path } from '../../config'

export class AmendPage extends React.Component {
  constructor(props) {
    super(props)

    this.vote = user => type => async () => {
      const textID = this.state.amend.text._id
      if (!user.followedTexts.find(text => text._id === textID)) {
        await this.followText(textID)
      }

      Socket.fetch(type + 'VoteAmend', { id: this.props.match.params.id }).then(
        this.updateAmend
      )
    }

    this.updateAmend = amend => {
      Socket.emit('user')
      this.setState({ amend, error: null }, () => {
        this.computeDiff()
      })
    }

    this.followText = async id => {
      await Socket.fetch('followText', { id })
      await Socket.fetch('user')
    }

    this.convertMsToTime = ms => {
      const sec = Math.floor(ms / 1000)
      const hrs = Math.floor(sec / 3600)
      const mins = Math.floor((sec - 3600 * hrs) / 60)

      return hrs + ' heures et ' + mins + ' minutes'
    }

    this.state = {
      amend: null,
      error: null
    }
  }

  fetchData() {
    Socket.fetch('amend', { id: this.props.match.params.id })
      .then(amend => {
        this.setState({ amend }, () => {
          this.computeDiff()
          Socket.emit('user')
        })
      })
      .catch(error => {
        this.setState({ error })
      })
  }

  componentDidMount() {
    this.fetchData()

    Socket.on('amend/' + this.props.match.params.id, ({ error, data }) => {
      if (!error) {
        this.setState({ amend: data }, () => {
          this.computeDiff()
          Socket.emit('user')
        })
      }
    })
  }

  componentWillUnmount() {
    Socket.off('amend')
    Socket.off('amend/' + this.props.match.params.id)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.id !== this.props.match.params.id) {
      this.fetchData()
    }
  }

  computeDiff() {
    const dmp = new diff_match_patch()
    dmp.Diff_EditCost = 8

    let previousText = ''

    for (let index = 0; index < this.state.amend.version; index++) {
      const patch = this.state.amend.text.patches[index]
      previousText = dmp.patch_apply(dmp.patch_fromText(patch), previousText)[0]
    }

    const newText = dmp.patch_apply(
      dmp.patch_fromText(this.state.amend.patch),
      previousText
    )[0]

    const diffs = dmp.diff_main(previousText, newText)
    dmp.diff_cleanupSemantic(diffs)
    this.setState({ amend: { diffs, ...this.state.amend } })
  }

  getTitle() {
    return this.state.amend
      ? 'Amendement sur ' +
          this.state.amend.text.name +
          ' : ' +
          this.state.amend.name
      : 'Amendement'
  }

  render() {
    if (this.state.error) return <ErrorPage error={this.state.error} />

    return (
      <Page title={this.getTitle()}>
        <UserContext.Consumer>
          {({ user }) => (
            <>
              {this.state.amend && (
                <>
                  <Buttons>
                    <Button to={path.text(this.state.amend.text._id)}>
                      <Icon type="fas fa-chevron-left" />
                      <span>Retour au texte</span>
                    </Button>
                  </Buttons>
                  <Columns>
                    <Column>
                      <Amend data={this.state.amend} />
                    </Column>
                    <Column>
                      <Box>
                        <p className="is-size-5 has-text-centered has-text-weight-semibold">
                          Scrutin{' '}
                          {this.state.amend.closed ? 'clos' : 'en cours'} sur
                          l'amendement
                        </p>

                        {!this.state.amend.closed && (
                          <p className="has-text-centered">
                            Temps restant avant la fin du scrutin :{' '}
                            <CountDown
                              date={Time.addTimeToDate(
                                this.state.amend.created,
                                this.state.amend.delayMax
                              )}
                              className="has-text-weight-semibold"
                            />
                          </p>
                        )}

                        <hr />

                        {this.state.amend.upVotesCount +
                          this.state.amend.downVotesCount >
                        0 ? (
                          <>
                            <Results
                              value={(
                                Math.round(
                                  100 * this.state.amend.upVotesCount
                                ) /
                                (this.state.amend.upVotesCount +
                                  this.state.amend.downVotesCount)
                              ).toFixed(1)}
                            />
                            <p className="has-text-centered">
                              {this.state.amend.upVotesCount +
                                this.state.amend.downVotesCount}{' '}
                              vote(s) exprimé(s) sur{' '}
                              {this.state.amend.totalPotentialVotesCount
                                ? this.state.amend.totalPotentialVotesCount
                                : this.state.amend.text.followersCount}{' '}
                              participant(s), soit{' '}
                              <span className="has-text-weight-semibold">
                                {(
                                  (100 *
                                    (this.state.amend.upVotesCount +
                                      this.state.amend.downVotesCount)) /
                                  (this.state.amend.totalPotentialVotesCount
                                    ? this.state.amend.totalPotentialVotesCount
                                    : this.state.amend.text.followersCount)
                                ).toFixed(1)}
                                % de participation
                              </span>
                            </p>
                          </>
                        ) : (
                          <p className="has-text-centered">
                            Aucun vote n'est encore enregistré pour ce scrutin
                          </p>
                        )}

                        {user && (
                          <>
                            <hr />
                            <Buttons className="is-fullwidth">
                              <Button
                                className={
                                  user.upVotes.find(
                                    id => id === this.state.amend._id
                                  )
                                    ? 'is-success'
                                    : 'is-light'
                                }
                                disabled={this.state.amend.closed}
                                onClick={this.vote(user)('up')}
                                style={{ flex: 1 }}
                              >
                                Voter pour
                              </Button>
                              <Button
                                className={
                                  !user.upVotes.find(
                                    id => id === this.state.amend._id
                                  ) &&
                                  !user.downVotes.find(
                                    id => id === this.state.amend._id
                                  )
                                    ? 'is-dark'
                                    : 'is-light'
                                }
                                disabled={this.state.amend.closed}
                                onClick={this.vote(user)('un')}
                                style={{ flex: 1 }}
                              >
                                S'abstenir
                              </Button>
                              <Button
                                className={
                                  user.downVotes.find(
                                    id => id === this.state.amend._id
                                  )
                                    ? 'is-danger'
                                    : 'is-light'
                                }
                                disabled={this.state.amend.closed}
                                onClick={this.vote(user)('down')}
                                style={{ flex: 1 }}
                              >
                                Voter contre
                              </Button>
                            </Buttons>
                          </>
                        )}

                        {this.state.amend.closed && (
                          <>
                            <p className="has-text-centered has-text-weight-semibold has-text-danger">
                              Le scrutin est clos. L'amendement a été{' '}
                              {this.state.amend.accepted ? 'accepté' : 'refusé'}{' '}
                              par les participants.
                            </p>

                            {this.state.amend.conflicted && (
                              <>
                                <br />
                                <p className="has-text-centered has-text-weight-semibold">
                                  Mais des conflits ont été détectés à
                                  l'application de l'amendement. Une nouvelle
                                  fonctionalité permettra prochainement aux
                                  auteurs des amendements de corriger ces
                                  conflits avant les scrutins.
                                </p>
                              </>
                            )}
                          </>
                        )}
                      </Box>

                      <Notification className="is-light">
                        <p>
                          Le vote est{' '}
                          <span className="has-text-weight-semibold">
                            clos à la fin du temps imparti
                          </span>{' '}
                          ou dès lors qu'une majorité absolue est atteinte après
                          un delai minimum d'une heure. Le{' '}
                          <span className="has-text-weight-semibold">
                            vote est liquide
                          </span>
                          , ce qui veut dire que vous pouvez changer votre vote
                          jusqu'à la fin du scrutin.
                        </p>
                      </Notification>
                    </Column>
                  </Columns>
                </>
              )}
            </>
          )}
        </UserContext.Consumer>
      </Page>
    )
  }
}
