import React, { FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';

import { makeStyles } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import PanoramaHorizontal from '@material-ui/icons/PanoramaHorizontal';
import Search from '@material-ui/icons/Search';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import { ClassNameMap } from '@material-ui/styles';
import TextField from '@material-ui/core/TextField';
import { Button } from '@material-ui/core';

import { useService } from '../services/useService';
import { CatalogService, CatalogTreeNode } from '../services/CatalogService';
import { Layer } from '../models/Layer';
import { LegendService } from '../services/LegendService';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { ConfigService } from '../services/ConfigService';

import polygon from '../images/polygon-icon.png';
import line from '../images/line-icon.png';
import point from '../images/point-icon.png';
import tile from '../images/tile-icon.png';

const imageTypes = new Map<string, {
	label:string,
	image: string
}>();
imageTypes.set('poly', {label: 'Polygons', image: polygon});
imageTypes.set('pt', {label: 'Points', image: point});
imageTypes.set('line', {label: 'Lines', image: line});
imageTypes.set('tiled_overlay', {label: 'Tiled Data', image: tile});

const iconStyle = {
	width: '16px'
};
interface CatalogComponentProps extends RouteComponentProps<any> {
}

const renderTree = (nodes: CatalogTreeNode[], classes:ClassNameMap, gsurl: string, addLayer: (l:Layer) => Promise<void>) => {
	let items: JSX.Element[] = [];

	if (nodes.length === 1) {
		const node = nodes[0];

		if (node.Folder) {
			items = items.concat(node.Folder.map((node) => (
				<TreeItem
					classes={classes}
					key={node.title + '::' + node.style}
					nodeId={node.title + '::' + node.style}
					label={node.title}
				>
					{renderTree([ node ], classes, gsurl, addLayer)}
				</TreeItem>
			)));
		}

		if (node.Layer) {
			items = items.concat(node.Layer.map((node) => (
				<TreeItem
					classes={classes}
					icon={<img
							style={iconStyle}
							src={imageTypes.get(node.type as string)!.image}
						/>}
					key={node.title + '::' + node.style}
					nodeId={node.title + '::' + node.style}
					label={node.title}
					onClick={() => {
						const l = new Layer(
							node.name!,
							node.style!,
							node.title!,
							node.type!,
							node.agol || gsurl + '/geoserver/wms',
							node.query || node.name!,
							gsurl,
						);
						addLayer(l);
					}}
				/>
			)));
		}
	}

	return (items);
};

const useStyles = makeStyles({
	root: {
		flexGrow: 1,
		maxWidth: 400,
	}
	// ,content : {
	// 	alignItems: 'start',
	// }
});

interface CatalogComponentState {
	showAutoComplete: boolean;
}

const CatalogComponent: FunctionComponent<CatalogComponentProps> = observer(({}) => {

	const classes = useStyles();

	const [ catalogService, legendService, configService ] = useService([ CatalogService, LegendService, ConfigService ]);

	const myState = useLocalObservable<CatalogComponentState>(() => {
		return {
			showAutoComplete: false,
		}
	});

	if (!catalogService.ready) {
		return (<div>loading...</div>);
	}

	return (
		<div>
			{myState.showAutoComplete && (<Autocomplete
				id="combo-box-demo"
				options={catalogService.uniqueLayers}
				handleHomeEndKeys={false}
				getOptionLabel={(option) => option.title}
				style={{ width: '100%', paddingTop: '10px' }}
				renderInput={(params) =>
					<TextField
						{...params}
						label="Search for a layer"
						variant="outlined"
						inputRef={input => {
							input && input.focus();
						}}
					/>
				}
				size="small"
				onClose={(e, r) => {
					if (r === 'blur') {
						return;
					}
					myState.showAutoComplete = false;
				}}
				onChange={(e, v) => {
					if (!v) {
						myState.showAutoComplete = false;
						return;
					}
					const l = new Layer(
						v.name!,
						v.style!,
						v.title!,
						v.type!,
						v.agol || configService.geoserverUrl + '/geoserver/wms',
						v.query || v.name!,
						configService.geoserverUrl,
					);
					legendService.addLayer.bind(legendService)(l);
				}}
			/>)}
			{!myState.showAutoComplete && (
				<Button
					onClick={() => {
						myState.showAutoComplete = true;
					}}
					style={{
						position: 'absolute',
						right: '8px',
						zIndex: 100
					}}
				>
					<Search />
				</Button>
			)}
			<TreeView
				classes={classes}
				defaultCollapseIcon={<ExpandMoreIcon/>}
				defaultExpanded={[ 'root' ]}
				defaultExpandIcon={<ChevronRightIcon/>}
			>
				{
					renderTree(catalogService.layerTree, classes, configService.geoserverUrl, legendService.addLayer.bind(legendService))
				}
			</TreeView>
		</div>
	);
});

export default withRouter(CatalogComponent);