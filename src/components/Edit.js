import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	BlockControls,
	RichText,
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useMemo, useCallback, useState, useEffect } from '@wordpress/element';
import {
	PanelBody,
	SelectControl,
	TextControl,
	TextareaControl,
	Button,
	ButtonGroup,
	ToggleControl,
	ToolbarGroup
} from '@wordpress/components';
import { debounce } from '@wordpress/compose';
import ImageSettingsPanel from './ImageSettingsPanel';
import LinkSettingsPanel from './LinkSettingsPanel';
import TagNameToolbar from './TagNameToolbar';
import PlainClassesManager from './PlainClassesManager';
import TwigControlsPanel from './TwigControlsPanel';
import BlockPreview from './BlockPreview';
import {
	extractPreviewContext,
	serializeBlockForPreview,
	fetchDynamicPreview
} from '../utils/preview';
import {
	isPanelEnabled,
	isControlEnabled,
	getAllowedTags,
	getAllowedContentTypes
} from '../utils/useBlockSettings';

// Filter content type options based on settings
function getContentTypeOptions() {
	const allowedTypes = getAllowedContentTypes();
	const allOptions = [
		{ label: 'Blocks (Container)', value: 'blocks' },
		{ label: 'Text', value: 'text' },
		{ label: 'HTML', value: 'html' },
		{ label: 'Empty', value: 'empty' }
	];
	return allOptions.filter(opt => allowedTypes.includes(opt.value));
}

const DATABASE_ICON_SVG = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
		<path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.59 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm6 14c0 .55-2.69 2-6 2s-6-1.45-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V17zm0-4.55c-1.3.95-3.58 1.55-6 1.55s-4.7-.6-6-1.55V9.64c1.47.83 3.61 1.36 6 1.36s4.53-.53 6-1.36v2.81zM12 9C8.69 9 6 7.55 6 7s2.69-2 6-2 6 1.45 6 2-2.69 2-6 2z" />
	</svg>
);

const INNER_BLOCKS_CONFIG = {
	renderAppender: InnerBlocks.ButtonBlockAppender
};

export default function Edit({ attributes, setAttributes, clientId }) {
	const {
		tagName = 'div',
		contentType = 'blocks',
		content = '',
		globalAttrs = {},
		isSelfClosing = false,
		dynamicPreview = false
	} = attributes;

	// Preview state
	const [previewHtml, setPreviewHtml] = useState('');
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);
	const [previewError, setPreviewError] = useState(null);

	// Memoize filtered global attributes
	const filteredGlobalAttrs = useMemo(() => {
		const out = {};
		for (const k in globalAttrs) {
			if (k !== 'class') {
				out[k] = globalAttrs[k];
			}
		}
		if (!out.id) {
			out.id = `block-${clientId}`;
		}
		return out;
	}, [globalAttrs, clientId]);

	// For blocks content type, apply blockProps directly to the element (no wrapper)
	const blockProps = useBlockProps({
		className: attributes.className || '',
		...filteredGlobalAttrs,
		// Prevent link navigation in editor for anchor tags
		...(tagName === 'a' && { onClick: (e) => e.preventDefault() })
	});

	// For blocks content type, use innerBlocksProps merged with our element props
	const innerBlocksProps = useInnerBlocksProps(blockProps, INNER_BLOCKS_CONFIG);

	// Memoize element props for non-blocks content types
	const elementProps = useMemo(() => {
		const props = { ...blockProps };

		// Prevent link navigation in editor
		if (tagName === 'a') {
			props.onClick = (e) => e.preventDefault();
		}

		return props;
	}, [blockProps, tagName]);

	// PERFORMANCE: Metadata updates disabled - they were causing 4+ second delays on pages with many blocks
	// The block labels in the list view are nice-to-have but not critical for functionality
	// TODO: Implement lazy metadata updates (only when block is selected or visible in viewport)

	// Memoized callbacks
	const onTagChange = useCallback((value) => setAttributes({ tagName: value }), [setAttributes]);
	const onContentTypeChange = useCallback((value) => setAttributes({ contentType: value }), [setAttributes]);
	const onDynamicPreviewToggle = useCallback(() => setAttributes({ dynamicPreview: !dynamicPreview }), [dynamicPreview, setAttributes]);

	// Preview fetch function
	const fetchPreview = useCallback(async () => {
		setIsLoadingPreview(true);
		setPreviewError(null);

		try {
			// Serialize block and get context
			const blockMarkup = serializeBlockForPreview(clientId);
			const context = extractPreviewContext();

			// Fetch preview from server
			const response = await fetchDynamicPreview(blockMarkup, clientId, context);

			// Update preview HTML
			setPreviewHtml(response.content || '');
		} catch (error) {
			console.error('Preview error:', error);
			setPreviewError(error.message || 'Failed to load preview');
		} finally {
			setIsLoadingPreview(false);
		}
	}, [clientId]);

	// Debounced preview fetch (500ms delay)
	const debouncedFetchPreview = useMemo(
		() => debounce(fetchPreview, 500),
		[fetchPreview]
	);

	// Effect: Fetch preview when toggle is ON or attributes change
	useEffect(() => {
		if (dynamicPreview) {
			debouncedFetchPreview();
		} else {
			// Clear preview when toggle is OFF
			setPreviewHtml('');
			setPreviewError(null);
		}

		// Cleanup debounce on unmount
		return () => {
			debouncedFetchPreview.cancel();
		};
	}, [dynamicPreview, attributes, debouncedFetchPreview]);

	// Open HTML editor popup
	const openHtmlEditor = useCallback(() => {
		if (typeof window.openUniversalBlockHtmlEditor === 'function') {
			window.openUniversalBlockHtmlEditor();
		} else {
			console.error('HTML Editor not available. Make sure editor tweaks are loaded.');
		}
	}, []);

	// Open Attributes editor popup
	const openAttributesEditor = useCallback(() => {
		if (typeof window.openUniversalBlockAttributesEditor === 'function') {
			window.openUniversalBlockAttributesEditor();
		} else {
			console.error('Attributes Editor not available. Make sure editor tweaks are loaded.');
		}
	}, []);

	// Convert HTML to blocks
	const convertToBlocks = () => {
		if (!content) {
			alert('No HTML content to convert');
			return;
		}

		// Check if parser is available
		if (typeof window.universal === 'undefined' || typeof window.universal.html2blocks !== 'function') {
			console.error('HTML to blocks parser not loaded');
			alert('HTML parser not available. Please refresh the page.');
			return;
		}

		// Parse HTML to block data using custom parser
		const blockData = window.universal.html2blocks(content);

		if (!blockData || blockData.length === 0) {
			alert('Could not convert HTML to blocks');
			return;
		}

		// Recursively convert block data to WordPress blocks
		const convertBlockData = (data) => {
			const innerBlocks = data.innerBlocks && data.innerBlocks.length > 0
				? data.innerBlocks.map(convertBlockData)
				: [];
			return createBlock(data.name, data.attributes, innerBlocks);
		};

		const innerBlocks = blockData.map(convertBlockData);

		// Convert current block to blocks contentType with the parsed content as innerBlocks
		setAttributes({
			contentType: 'blocks',
			content: ''
		});

		// Use replaceInnerBlocks to add the parsed blocks as children
		const { replaceInnerBlocks } = wp.data.dispatch('core/block-editor');
		replaceInnerBlocks(clientId, innerBlocks);
	};

	// Convert blocks to HTML
	const convertToHtml = () => {
		const { getBlock } = wp.data.select('core/block-editor');
		const block = getBlock(clientId);

		if (!block || !block.innerBlocks || block.innerBlocks.length === 0) {
			alert('No blocks to convert');
			return;
		}

		// Check if serializer is available
		if (typeof window.universal === 'undefined' || typeof window.universal.blocks2html !== 'function') {
			console.error('Blocks to HTML serializer not loaded');
			alert('Serializer not available. Please refresh the page.');
			return;
		}

		// Serialize innerBlocks to HTML using blocks2html from lib/blocks2html.js
		const html = window.universal.blocks2html(block.innerBlocks);

		if (!html) {
			alert('Could not convert blocks to HTML');
			return;
		}

		// Convert current block to HTML contentType with the serialized content
		setAttributes({
			contentType: 'html',
			content: html
		});

		// Clear innerBlocks
		const { replaceInnerBlocks } = wp.data.dispatch('core/block-editor');
		replaceInnerBlocks(clientId, []);
	};

	const TagElement = tagName;

	return (
		<>
			<BlockControls>
				{isPanelEnabled('tagNameToolbar') && (
					<ToolbarGroup>
						<TagNameToolbar
							tagName={tagName}
							onChange={onTagChange}
						/>
					</ToolbarGroup>
				)}
				{isPanelEnabled('dynamicPreviewButton') && (
					<ToolbarGroup>
						<Button
							icon={DATABASE_ICON_SVG}
							label={__('Toggle Dynamic Preview', 'universal-block')}
							isPressed={dynamicPreview}
							onClick={onDynamicPreviewToggle}
						/>
					</ToolbarGroup>
				)}
			</BlockControls>

			<InspectorControls>
				{/* Plain Classes Manager */}
				{isPanelEnabled('plainClassesManager') && (
					<div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
						<PlainClassesManager
							className={attributes.className || ''}
							onChange={(newClassName) => setAttributes({ className: newClassName })}
						/>
					</div>
				)}

				{/* Dynamic Preview Toggle */}
				{isPanelEnabled('dynamicPreviewToggle') && (
					<div style={{
						padding: '16px',
						borderBottom: `1px solid ${dynamicPreview ? 'rgba(59, 130, 246, 0.2)' : '#e0e0e0'}`,
						background: 'transparent'
					}}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<div style={{ flex: 1 }}>
								<ToggleControl
									label={__('Dynamic Preview', 'universal-block')}
									checked={dynamicPreview}
									onChange={onDynamicPreviewToggle}
									help={dynamicPreview
										? __('Preview mode active - showing live data from Timber/Twig context', 'universal-block')
										: __('Enable to preview dynamic content with real data', 'universal-block')
									}
								/>
							</div>
							{dynamicPreview && (
								<Button
									icon="edit"
									label={__('Edit Block', 'universal-block')}
									onClick={() => {
										// Turn off preview mode to return to editing
										setAttributes({ dynamicPreview: false });
									}}
									style={{
										marginTop: '-8px',
										color: '#3b82f6'
									}}
								/>
							)}
						</div>
					</div>
				)}

				{isPanelEnabled('elementSettings') && (
					<PanelBody title={__('Element Settings', 'universal-block')}>
					<TextControl
						label={__('HTML Tag', 'universal-block')}
						value={tagName}
						onChange={(value) => setAttributes({ tagName: value })}
						help={__('Enter any HTML tag name (e.g., div, section, custom-element)', 'universal-block')}
					/>

					{isControlEnabled('elementSettings', 'contentType') && (
						<SelectControl
							label={__('Content Type', 'universal-block')}
							value={contentType}
							options={getContentTypeOptions()}
							onChange={onContentTypeChange}
						/>
					)}


					{contentType === 'text' && isControlEnabled('elementSettings', 'textContent') && (
						<TextareaControl
							label={__('Text Content', 'universal-block')}
							value={content}
							onChange={(value) => setAttributes({ content: value })}
							rows={4}
							help={__('Enter plain text content for this element', 'universal-block')}
							style={{ marginTop: '12px' }}
						/>
					)}
					{isControlEnabled('elementSettings', 'selfClosing') && (
						<ToggleControl
							label={__('Self Closing', 'universal-block')}
							checked={isSelfClosing}
							onChange={(value) => setAttributes({ isSelfClosing: value })}
							help={__('Render as self-closing tag (e.g., <img />)', 'universal-block')}
						/>
					)}

					{isControlEnabled('elementSettings', 'editAttributes') && (
						<Button
							variant="secondary"
							onClick={openAttributesEditor}
							style={{ marginTop: '8px', width: '100%' }}
						>
							<i className="ri-braces-line" style={{ marginRight: '6px' }}></i>
							{__('Edit Attributes', 'universal-block')}
						</Button>
					)}

					{contentType === 'blocks' && isControlEnabled('elementSettings', 'toHtml') && (
						<Button
							variant="secondary"
							onClick={convertToHtml}
							style={{ marginTop: '8px', width: '100%' }}
						>
							<i className="ri-code-line" style={{ marginRight: '6px' }}></i>
							{__('To HTML', 'universal-block')}
						</Button>
					)}

					{contentType === 'html' && (
						<ButtonGroup style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
							{isControlEnabled('elementSettings', 'editHtml') && (
								<Button
									variant="secondary"
									onClick={openHtmlEditor}
									style={{ flex: 1 }}
								>
									<i className="ri-code-line" style={{ marginRight: '6px' }}></i>
									{__('Edit HTML', 'universal-block')}
								</Button>
							)}
							{content && isControlEnabled('elementSettings', 'toBlocks') && (
								<Button
									variant="secondary"
									onClick={convertToBlocks}
									style={{ flex: 1 }}
								>
									<i className="ri-stack-line" style={{ marginRight: '6px' }}></i>
									{__('To Blocks', 'universal-block')}
								</Button>
							)}
						</ButtonGroup>
					)}
					</PanelBody>
				)}


				{/* Image Settings Panel - only show for img tags */}
				{tagName === 'img' && isPanelEnabled('imageSettings') && (
					<ImageSettingsPanel
						globalAttrs={globalAttrs}
						setAttributes={setAttributes}
					/>
				)}

				{/* Link Settings Panel - only show for a tags */}
				{tagName === 'a' && isPanelEnabled('linkSettings') && (
					<LinkSettingsPanel
						globalAttrs={globalAttrs}
						setAttributes={setAttributes}
					/>
				)}

				{/* Twig Controls Panel - available on all blocks */}
				<TwigControlsPanel
					attributes={attributes}
					setAttributes={setAttributes}
				/>
			</InspectorControls>

			{/* Render based on content type */}
			{dynamicPreview ? (
				<BlockPreview
					html={previewHtml}
					isLoading={isLoadingPreview}
					error={previewError}
					onRetry={fetchPreview}
					onExitPreview={() => setAttributes({ dynamicPreview: false })}
					onSelectBlock={() => {
						const { selectBlock } = wp.data.dispatch('core/block-editor');
						selectBlock(clientId);
					}}
					showBadge={true}
				/>
			) : (
				<>
					{contentType === 'blocks' && (
						<TagElement {...innerBlocksProps}>
							{innerBlocksProps.children}
						</TagElement>
					)}

					{contentType === 'text' && (
						<RichText
							tagName={tagName}
							value={content}
							onChange={(value) => setAttributes({ content: value })}
							placeholder={__('Enter text...', 'universal-block')}
							{...elementProps}
						/>
					)}

					{contentType === 'html' && (
						<TagElement
							{...elementProps}
							dangerouslySetInnerHTML={{ __html: content || '<p style="color: #999; padding: 20px; text-align: center;">No HTML content. Use the sidebar to open the HTML editor.</p>' }}
						/>
					)}

					{contentType === 'empty' && (
						<TagElement {...elementProps} />
					)}
				</>
			)}
		</>
	);
}
