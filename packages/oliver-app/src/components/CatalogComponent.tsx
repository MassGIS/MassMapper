import { makeStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import { observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { useService } from '../services/useService';
import 'leaflet/dist/leaflet.css';
import { ClassNameMap } from '@material-ui/styles';
import { CatalogService, CatalogTreeNode } from '../services/CatalogService';

interface CatalogComponentProps extends RouteComponentProps<any> {
	classes:ClassNameMap;
}

const renderTree = (node:CatalogTreeNode) =>  {
	const id = `id-${Math.random()}`;

	let items = [];
	if (Array.isArray(node.Folder)) {
		items = items.concat(node.Folder.map((node) => (
			<TreeItem
				key={node.title + '::' + node.style}
				nodeId={node.title + '::' + node.style}
				label={node.title}
			>
					{renderTree(node)}
			</TreeItem>
		)));
	}
	if (Array.isArray(node.Layer)) {
		items = items.concat(node.Layer.map((node) => (
			<TreeItem
				key={node.title + '::' + node.style}
				nodeId={node.title + '::' + node.style}
				label={node.title}
			/>
		)));
	}

	return (items);
};

const useStyles = makeStyles({
	root: {
	  height: 110,
	  flexGrow: 1,
	  maxWidth: 400,
	},
  });


const CatalogComponent: FunctionComponent<CatalogComponentProps> = observer(({}) => {

	const classes = useStyles();

	const [ catalogService ] = useService([ CatalogService ]);

	if (!catalogService.ready) {
		return (<div>loading...</div>);
	}

	return (
		<TreeView
			classes={classes}
			defaultCollapseIcon={<ExpandMoreIcon />}
			defaultExpanded={['root']}
			defaultExpandIcon={<ChevronRightIcon />}
		>
			{
				renderTree(catalogService.layerTree)
			}
		</TreeView>
	);


});

export default withRouter(CatalogComponent);