import { __ } from '@wordpress/i18n';
import { ToolbarButton, Popover, TextControl, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Tag Name Toolbar Control
 * Shows current tag name in toolbar with quick edit popover
 */
export default function TagNameToolbar({ tagName, onChange }) {
	const [isOpen, setIsOpen] = useState(false);
	const [tempValue, setTempValue] = useState(tagName);

	const handleOpen = () => {
		setTempValue(tagName);
		setIsOpen(true);
	};

	const handleSave = () => {
		if (tempValue && tempValue.trim()) {
			onChange(tempValue.trim());
		}
		setIsOpen(false);
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		} else if (e.key === 'Escape') {
			setIsOpen(false);
		}
	};

	// Capitalize first letter only
	const displayName = tagName.charAt(0).toUpperCase() + tagName.slice(1);

	return (
		<>
			<ToolbarButton
				onClick={handleOpen}
				aria-label={__('Change tag name', 'universal-block')}
				style={{
					fontFamily: 'Monaco, Menlo, monospace',
					fontSize: '11px',
					fontWeight: '900',
					letterSpacing: '0.5px'
				}}
			>
				{displayName}
			</ToolbarButton>

			{isOpen && (
				<Popover
					position="bottom center"
					onClose={() => setIsOpen(false)}
					focusOnMount="firstElement"
				>
					<div style={{ padding: '16px', minWidth: '250px' }}>
						<TextControl
							label={__('HTML Tag Name', 'universal-block')}
							value={tempValue}
							onChange={setTempValue}
							onKeyDown={handleKeyDown}
							placeholder="div, section, article..."
							help={__('Press Enter to save, Esc to cancel', 'universal-block')}
							style={{ fontFamily: 'Monaco, Menlo, monospace' }}
							autoFocus
						/>
						<div style={{
							display: 'flex',
							gap: '8px',
							marginTop: '12px',
							justifyContent: 'flex-end'
						}}>
							<Button
								variant="secondary"
								onClick={() => setIsOpen(false)}
								size="small"
							>
								{__('Cancel', 'universal-block')}
							</Button>
							<Button
								variant="primary"
								onClick={handleSave}
								size="small"
							>
								{__('Save', 'universal-block')}
							</Button>
						</div>
					</div>
				</Popover>
			)}
		</>
	);
}
