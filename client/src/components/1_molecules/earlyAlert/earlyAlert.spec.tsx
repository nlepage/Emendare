import * as React from 'react'
import enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

enzyme.configure({ adapter: new Adapter() })

import { EarlyAlert } from './earlyAlert'
import { Providers } from '../../../components'

it('should render a EarlyAlert', () => {
  const component = shallow(
    <Providers>
      <EarlyAlert />
    </Providers>
  )
  expect(component).toBeTruthy()
})
