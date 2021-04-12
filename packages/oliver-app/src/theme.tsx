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
			main: '#D1DFF0',
		},
		secondary: {
			main: '#19857b',
		},
	},
	mixins: {
		// toolbar: {
		// 	'@media (min-width:600px)' : {
		// 		minHeight: 34
		// 	}
		// }
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