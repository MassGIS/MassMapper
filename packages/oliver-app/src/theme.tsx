import red from '@material-ui/core/colors/red';
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
	palette: {
		background: {
			default: '#fff',
		},
		error: {
			main: red.A400,
		},
		primary: {
			main: '#556cd6',
		},
		secondary: {
			main: '#19857b',
		},
	},
	overrides: {
		MuiCssBaseline: {
			'@global': {
				body: {
					height: '100%'
				},
				html: {
					height: '100%'
				},
				'#react-root': {
					height: '100%'
				}
			}
		}
	}
});

export default theme;