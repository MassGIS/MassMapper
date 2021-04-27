import { makeStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import { observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { useService } from '../services/useService';
import { CatalogService, CatalogTreeNode } from '../services/CatalogService';
import PanoramaHorizontal from '@material-ui/icons/PanoramaHorizontal';
import { Layer } from '../models/Layer';
import { LegendService } from '../services/LegendService';
import { ClassNameMap } from '@material-ui/styles';
interface CatalogComponentProps extends RouteComponentProps<any> {
}

const renderTree = (nodes: CatalogTreeNode[], classes:ClassNameMap, addLayer: (l:Layer) => Promise<void>) => {
	let items: JSX.Element[] = [];

	if (nodes.length === 1) {
		const node = nodes[0];

		if (Array.isArray(node.Folder)) {
			items = items.concat(node.Folder.map((node) => (
				<TreeItem
					classes={classes}
					key={node.title + '::' + node.style}
					nodeId={node.title + '::' + node.style}
					label={node.title}
				>
					{renderTree([ node ], classes, addLayer)}
				</TreeItem>
			)));
		}

		if (Array.isArray(node.Layer)) {
			items = items.concat(node.Layer.map((node) => (
				<TreeItem
					classes={classes}
					icon={<PanoramaHorizontal />}
					key={node.title + '::' + node.style}
					nodeId={node.title + '::' + node.style}
					label={node.title}
					onClick={() => {
						const l = new Layer(
							node.name!,
							node.style!,
							node.title!,
							node.type!
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
	},
	content : {
		alignItems: 'start',
	}
});

const CatalogComponent: FunctionComponent<CatalogComponentProps> = observer(({}) => {

	const classes = useStyles();

	const [ catalogService, legendService ] = useService([ CatalogService, LegendService ]);

	if (!catalogService.ready) {
		return (<div>loading...</div>);
	}

	return (
		<TreeView
			classes={classes}
			defaultCollapseIcon={<ExpandMoreIcon/>}
			defaultExpanded={[ 'root' ]}
			defaultExpandIcon={<ChevronRightIcon/>}
		>
			{
				renderTree(catalogService.layerTree, classes, legendService.addLayer.bind(legendService))
			}
		</TreeView>
	);
});

export default withRouter(CatalogComponent);