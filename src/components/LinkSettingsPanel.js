import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl, TextControl, SelectControl, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Link Settings Panel
 * Manages link-specific attributes for a tags (href, target, rel, aria-label, etc.)
 */
export default function LinkSettingsPanel({ globalAttrs, setAttributes }) {
	const {
		href = '',
		target = '',
		rel = '',
		'aria-label': ariaLabel = ''
	} = globalAttrs;

	const [isExternal, setIsExternal] = useState(!href || href.startsWith('http') || href.startsWith('//'));
	const [selectedPostType, setSelectedPostType] = useState('page');
	const [selectedPostId, setSelectedPostId] = useState('');
	const [isPanelOpen, setIsPanelOpen] = useState(false); // Start closed for better performance

	const updateLinkAttr = (attr, value) => {
		setAttributes({
			globalAttrs: {
				...globalAttrs,
				[attr]: value
			}
		});
	};

	const removeLinkAttr = (attr) => {
		const newAttrs = { ...globalAttrs };
		delete newAttrs[attr];
		setAttributes({ globalAttrs: newAttrs });
	};

	// PERFORMANCE: Only fetch posts/pages when panel is open AND internal link mode is active
	// This prevents unnecessary API calls when selecting blocks with <a> tags
	const { posts, postTypes } = useSelect((select) => {
		// Don't fetch if panel is closed or external link mode
		if (!isPanelOpen || isExternal) {
			return { posts: null, postTypes: null };
		}

		const { getEntityRecords, getPostTypes } = select('core');

		return {
			posts: getEntityRecords('postType', selectedPostType, {
				per_page: 100,
				orderby: 'title',
				order: 'asc',
				status: 'publish'
			}),
			postTypes: getPostTypes({ per_page: -1 })
		};
	}, [selectedPostType, isPanelOpen, isExternal]);

	const postTypeOptions = postTypes
		? postTypes
			.filter(type => type.viewable && type.slug !== 'attachment')
			.map(type => ({
				label: type.labels.singular_name,
				value: type.slug
			}))
		: [];

	const postOptions = posts
		? [
			{ label: __('Select a post...', 'universal-block'), value: '' },
			...posts.map(post => ({
				label: post.title.rendered || __('(no title)', 'universal-block'),
				value: post.id
			}))
		]
		: [{ label: __('Loading...', 'universal-block'), value: '' }];

	const handlePostSelection = (postId) => {
		setSelectedPostId(postId);
		if (postId && posts) {
			const selectedPost = posts.find(p => p.id === parseInt(postId));
			if (selectedPost) {
				updateLinkAttr('href', selectedPost.link);
			}
		}
	};

	const handleLinkTypeToggle = (external) => {
		setIsExternal(external);
		if (!external) {
			// Switching to internal - clear href
			removeLinkAttr('href');
			setSelectedPostId('');
		}
	};

	return (
		<PanelBody
			title={__('Link Settings', 'universal-block')}
			initialOpen={false}
			onToggle={(isOpen) => setIsPanelOpen(isOpen)}
		>
			<ToggleControl
				label={__('External Link', 'universal-block')}
				checked={isExternal}
				onChange={handleLinkTypeToggle}
				help={isExternal
					? __('Enter a URL manually', 'universal-block')
					: __('Select from posts/pages', 'universal-block')
				}
			/>

			{isExternal ? (
				<TextControl
					label={__('URL', 'universal-block')}
					value={href}
					onChange={(value) => updateLinkAttr('href', value)}
					placeholder="https://example.com"
					help={__('Enter the full URL including https://', 'universal-block')}
				/>
			) : (
				<>
					<SelectControl
						label={__('Post Type', 'universal-block')}
						value={selectedPostType}
						options={postTypeOptions}
						onChange={setSelectedPostType}
					/>

					<SelectControl
						label={__('Select Post/Page', 'universal-block')}
						value={selectedPostId}
						options={postOptions}
						onChange={handlePostSelection}
					/>

					{href && (
						<div style={{
							marginTop: '8px',
							padding: '8px',
							background: '#f0f0f0',
							borderRadius: '4px',
							fontSize: '12px',
							wordBreak: 'break-all'
						}}>
							<strong>{__('URL:', 'universal-block')}</strong> {href}
						</div>
					)}
				</>
			)}

			<div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #ddd' }}>
				<ToggleControl
					label={__('Open in New Tab', 'universal-block')}
					checked={target === '_blank'}
					onChange={(checked) => {
						if (checked) {
							updateLinkAttr('target', '_blank');
							// Add security rel attributes for external links
							updateLinkAttr('rel', 'noopener noreferrer');
						} else {
							removeLinkAttr('target');
							removeLinkAttr('rel');
						}
					}}
					help={target === '_blank'
						? __('Link opens in new tab/window', 'universal-block')
						: __('Link opens in same tab', 'universal-block')
					}
				/>

				{target === '_blank' && (
					<TextControl
						label={__('Rel Attribute', 'universal-block')}
						value={rel}
						onChange={(value) => updateLinkAttr('rel', value)}
						help={__('Relationship attributes (e.g., noopener noreferrer)', 'universal-block')}
					/>
				)}

				<TextControl
					label={__('ARIA Label', 'universal-block')}
					value={ariaLabel}
					onChange={(value) => updateLinkAttr('aria-label', value)}
					placeholder={__('Descriptive label for screen readers', 'universal-block')}
					help={__('Optional: Improve accessibility with a descriptive label', 'universal-block')}
				/>
			</div>

			{href && (
				<Button
					onClick={() => {
						removeLinkAttr('href');
						removeLinkAttr('target');
						removeLinkAttr('rel');
						removeLinkAttr('aria-label');
						setSelectedPostId('');
					}}
					variant="tertiary"
					isDestructive
					style={{ marginTop: '16px' }}
				>
					{__('Remove Link', 'universal-block')}
				</Button>
			)}
		</PanelBody>
	);
}
