/* eslint-disable jsx-a11y/label-has-for, sonarjs/cognitive-complexity */

import React from 'react'
import {
  Box,
  Button,
  Divider,
  Column,
  Columns,
  Icon,
  Grid,
  UserContext,
  DataContext,
  Link,
  Spacer
} from '../../../components'
import { path } from '../../../config'
import { Socket } from '../../../services'
import { isUndefined, sortBy } from 'lodash'

interface IExploreState {
  displayAddTextForm: boolean
  textName: string
  textDescription: string
}

export class Explore extends React.Component<{}, IExploreState> {
  private onChange: any
  private confirm: any
  private initialState: any

  constructor(props: {}) {
    super(props)

    this.onChange = (name: string) => (event: any) => {
      this.setState({ [name]: event.target.value } as any)
    }

    this.confirm = async () => {
      await Socket.fetch('postText', {
        name: this.state.textName,
        description: this.state.textDescription
      })
      this.setState({ displayAddTextForm: false, ...this.initialState })
    }

    this.initialState = {
      textName: '',
      textDescription: ''
    }

    this.state = {
      displayAddTextForm: false,
      ...this.initialState
    }
  }

  public render() {
    return (
      <UserContext.Consumer>
        {({ isConnected }) => (
          <DataContext.Consumer>
            {({ get }) => {
              const textsID = get('texts')('all')

              let texts = []

              if (textsID && textsID.data) {
                texts = textsID.data
                  .map((textID: string) => get('text')(textID))
                  .filter((text: any) => !isUndefined(text))
                  .map((text: any) => text.data)
              }

              return texts && texts.length > 0 ? (
                <React.Fragment>
                  {false && isConnected() && (
                    <React.Fragment>
                      <br />
                      <Button
                        className="is-fullwidth"
                        onClick={() => {
                          this.setState(prevState => ({
                            ...prevState,
                            displayAddTextForm: !prevState.displayAddTextForm
                          }))
                        }}
                      >
                        <span>
                          {this.state.displayAddTextForm
                            ? 'Annuler la création du texte'
                            : 'Créer un nouveau texte'}
                        </span>
                      </Button>
                    </React.Fragment>
                  )}

                  {isConnected() && this.state.displayAddTextForm && (
                    <React.Fragment>
                      <Box style={{ marginBottom: 0 }}>
                        <Columns>
                          <Column>
                            <div className="field">
                              <label htmlFor="name" className="label">
                                Nom du texte
                                <div className="control">
                                  <input
                                    required
                                    name="name"
                                    className="input"
                                    type="text"
                                    value={this.state.textName}
                                    onChange={this.onChange('textName')}
                                    placeholder="Nom du nouveau texte"
                                  />
                                </div>
                              </label>
                            </div>
                          </Column>
                          <Column>
                            <div className="field">
                              <label htmlFor="description" className="label">
                                Description du texte
                                <div className="control">
                                  <input
                                    required
                                    name="description"
                                    className="input"
                                    type="text"
                                    value={this.state.textDescription}
                                    onChange={this.onChange('textDescription')}
                                    placeholder="Description du nouveau texte"
                                  />
                                </div>
                              </label>
                            </div>
                          </Column>
                        </Columns>
                      </Box>
                      <Button
                        className="is-fullwidth is-success"
                        disabled={
                          !this.state.textName || !this.state.textDescription
                        }
                        onClick={this.confirm}
                      >
                        Confirmer la création du texte
                      </Button>
                    </React.Fragment>
                  )}
                  <br />
                  <Grid
                    style={{
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gridGap: '1.5rem'
                    }}
                  >
                    {sortBy(texts, ['followersCount'])
                      .reverse()
                      .map(text => (
                        <React.Fragment key={text._id}>
                          <Divider className="is-hidden-tablet" />
                          <Link
                            to={path.text(text._id)}
                            style={{ display: 'inline-grid' }}
                            className="has-text-dark"
                          >
                            <Box>
                              <div
                                className="is-size-4 is-flex"
                                style={{ flexWrap: 'wrap' }}
                              >
                                <p>{text.name}</p>
                                <Spacer />
                                <p>
                                  {text.followersCount}{' '}
                                  <Icon
                                    type={
                                      'fa fa-user' +
                                      (text.followersCount > 1 ? 's' : '')
                                    }
                                  />
                                </p>
                              </div>
                              <p>{text.description}</p>
                            </Box>
                          </Link>
                        </React.Fragment>
                      ))}
                  </Grid>
                </React.Fragment>
              ) : null
            }}
          </DataContext.Consumer>
        )}
      </UserContext.Consumer>
    )
  }
}
