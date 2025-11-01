import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	TextControl,
	Notice
} from '@wordpress/components';

/**
 * Twig Controls Panel
 * Provides inspector controls for Loop, Conditional Visibility, and Set Variable
 */
export default function TwigControlsPanel({ attributes, setAttributes }) {
	const {
		loopSource,
		loopVariable,
		conditionalVisibility,
		conditionalExpression,
		setVariable,
		setExpression
	} = attributes;

	return (
		<>
			{/* Loop Controls */}
			<PanelBody
				title={__('Loop Controls', 'universal-block')}
				initialOpen={false}
			>
				<ToggleControl
					label={__('Enable Loop', 'universal-block')}
					checked={!!loopSource}
					onChange={(value) => {
						if (!value) {
							setAttributes({ loopSource: '', loopVariable: 'item' });
						} else {
							setAttributes({ loopSource: 'posts' });
						}
					}}
					help={__('Repeat this element for each item in a collection', 'universal-block')}
				/>

				{loopSource && (
					<>
						<TextControl
							label={__('Loop Source', 'universal-block')}
							value={loopSource}
							onChange={(value) => setAttributes({ loopSource: value })}
							placeholder="posts"
							help={__('Collection to loop over (e.g., posts, user.posts, timber.get_posts(...))', 'universal-block')}
						/>

						<TextControl
							label={__('Item Variable', 'universal-block')}
							value={loopVariable}
							onChange={(value) => setAttributes({ loopVariable: value })}
							placeholder="item"
							help={__('Variable name for each item in the loop', 'universal-block')}
						/>

						<Notice status="info" isDismissible={false}>
							<strong>Output:</strong> {`{% for ${loopVariable || 'item'} in ${loopSource || '...'} %}`}
						</Notice>
					</>
				)}
			</PanelBody>

			{/* Conditional Visibility */}
			<PanelBody
				title={__('Conditional Visibility', 'universal-block')}
				initialOpen={false}
			>
				<ToggleControl
					label={__('Enable Conditional', 'universal-block')}
					checked={conditionalVisibility}
					onChange={(value) => {
						if (!value) {
							setAttributes({ conditionalVisibility: false, conditionalExpression: '' });
						} else {
							setAttributes({ conditionalVisibility: true });
						}
					}}
					help={__('Show this element only when condition is true', 'universal-block')}
				/>

				{conditionalVisibility && (
					<>
						<TextControl
							label={__('Condition', 'universal-block')}
							value={conditionalExpression}
							onChange={(value) => setAttributes({ conditionalExpression: value })}
							placeholder="item.title"
							help={__('Twig expression to evaluate (e.g., item.title, user.ID > 0)', 'universal-block')}
						/>

						<Notice status="info" isDismissible={false}>
							<strong>Output:</strong> {`{% if ${conditionalExpression || '...'} %}`}
						</Notice>
					</>
				)}
			</PanelBody>

			{/* Set Variable */}
			<PanelBody
				title={__('Set Variable', 'universal-block')}
				initialOpen={false}
			>
				<ToggleControl
					label={__('Set Variable', 'universal-block')}
					checked={!!setVariable}
					onChange={(value) => {
						if (!value) {
							setAttributes({ setVariable: '', setExpression: '' });
						} else {
							setAttributes({ setVariable: 'my_var' });
						}
					}}
					help={__('Define a Twig variable before this element', 'universal-block')}
				/>

				{setVariable && (
					<>
						<TextControl
							label={__('Variable Name', 'universal-block')}
							value={setVariable}
							onChange={(value) => setAttributes({ setVariable: value })}
							placeholder="my_var"
							help={__('Name of the variable to create', 'universal-block')}
						/>

						<TextControl
							label={__('Expression', 'universal-block')}
							value={setExpression}
							onChange={(value) => setAttributes({ setExpression: value })}
							placeholder="timber.get_posts({post_type: 'posts'})"
							help={__('Twig expression to assign to the variable', 'universal-block')}
						/>

						<Notice status="info" isDismissible={false}>
							<strong>Output:</strong> {`{% set ${setVariable || '...'} = ${setExpression || '...'} %}`}
						</Notice>
					</>
				)}
			</PanelBody>
		</>
	);
}
