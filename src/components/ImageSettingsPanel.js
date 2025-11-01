import { __ } from '@wordpress/i18n';
import { PanelBody, Button, TextControl } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';

/**
 * Image Settings Panel
 * Manages image-specific attributes for img tags
 */
export default function ImageSettingsPanel({ globalAttrs, setAttributes }) {
	const { src = '', alt = '', width = '', height = '' } = globalAttrs;

	const updateImageAttr = (attr, value) => {
		setAttributes({
			globalAttrs: {
				...globalAttrs,
				[attr]: value
			}
		});
	};

	const onSelectImage = (media) => {
		const newAttrs = {
			...globalAttrs,
			src: media.url
		};

		// Add alt text if available
		if (media.alt) {
			newAttrs.alt = media.alt;
		}

		// Add width and height if available
		if (media.width) {
			newAttrs.width = media.width.toString();
		}
		if (media.height) {
			newAttrs.height = media.height.toString();
		}

		setAttributes({ globalAttrs: newAttrs });
	};

	const removeImage = () => {
		const newAttrs = { ...globalAttrs };
		delete newAttrs.src;
		delete newAttrs.alt;
		delete newAttrs.width;
		delete newAttrs.height;
		setAttributes({ globalAttrs: newAttrs });
	};

	return (
		<PanelBody title={__('Image Settings', 'universal-block')} initialOpen={true}>
			<MediaUploadCheck>
				<MediaUpload
					onSelect={onSelectImage}
					allowedTypes={['image']}
					value={src}
					render={({ open }) => (
						<div>
							{src ? (
								<>
									<div style={{ marginBottom: '12px' }}>
										<img
											src={src}
											alt={alt || ''}
											style={{
												maxWidth: '100%',
												height: 'auto',
												border: '1px solid #ddd',
												borderRadius: '4px'
											}}
										/>
									</div>
									<div style={{ display: 'flex', gap: '8px' }}>
										<Button onClick={open} variant="secondary">
											{__('Replace Image', 'universal-block')}
										</Button>
										<Button onClick={removeImage} variant="tertiary" isDestructive>
											{__('Remove', 'universal-block')}
										</Button>
									</div>
								</>
							) : (
								<Button onClick={open} variant="primary">
									{__('Select Image', 'universal-block')}
								</Button>
							)}
						</div>
					)}
				/>
			</MediaUploadCheck>

			{src && (
				<div style={{ marginTop: '16px' }}>
					<TextControl
						label={__('Alt Text', 'universal-block')}
						value={alt}
						onChange={(value) => updateImageAttr('alt', value)}
						help={__('Describe the image for accessibility', 'universal-block')}
					/>
					<div style={{ marginTop: '8px', fontSize: '12px', color: '#757575' }}>
						{width && height && (
							<div style={{ marginBottom: '4px' }}>
								<strong>{__('Dimensions:', 'universal-block')}</strong> {width} × {height}
							</div>
						)}
						<div>
							<strong>{__('Source:', 'universal-block')}</strong>
							<div style={{ wordBreak: 'break-all', marginTop: '2px' }}>{src}</div>
						</div>
					</div>
				</div>
			)}
		</PanelBody>
	);
}
