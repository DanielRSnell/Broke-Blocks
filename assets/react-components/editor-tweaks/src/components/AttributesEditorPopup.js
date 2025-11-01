import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AceEditor from './AceEditor';
import RemixIcon from './RemixIcon';

const { __ } = wp.i18n;
const { select, dispatch } = wp.data;

/**
 * Attributes Editor Popup
 * Full-screen editor for managing block attributes (great for Alpine.js, HTMX, etc.)
 */
export default function AttributesEditorPopup({ isOpen, onClose }) {
	const [attributes, setAttributes] = useState({});
	const [selectedKey, setSelectedKey] = useState(null);
	const [keyInput, setKeyInput] = useState('');
	const [valueInput, setValueInput] = useState('');
	const [selectedBlockId, setSelectedBlockId] = useState(null);

	// Get selected block and its attributes when popup opens
	useEffect(() => {
		if (!isOpen) return;

		const blockId = select('core/block-editor').getSelectedBlockClientId();
		if (!blockId) {
			console.warn('No block selected');
			onClose();
			return;
		}

		const block = select('core/block-editor').getBlock(blockId);
		if (!block || block.name !== 'universal/element') {
			console.warn('Selected block is not a universal/element block');
			onClose();
			return;
		}

		setSelectedBlockId(blockId);
		setAttributes(block.attributes?.globalAttrs || {});
	}, [isOpen, onClose]);

	// Add or update attribute
	const handleSaveAttribute = () => {
		if (!keyInput.trim()) {
			alert('Attribute name is required');
			return;
		}

		const newAttrs = {
			...attributes,
			[keyInput]: valueInput
		};

		setAttributes(newAttrs);
		setSelectedKey(keyInput);
		setKeyInput('');
		setValueInput('');
	};

	// Delete attribute
	const handleDeleteAttribute = (key) => {
		const newAttrs = { ...attributes };
		delete newAttrs[key];
		setAttributes(newAttrs);
		if (selectedKey === key) {
			setSelectedKey(null);
		}
	};

	// Select attribute for editing
	const handleSelectAttribute = (key) => {
		setSelectedKey(key);
		setKeyInput(key);
		setValueInput(attributes[key] || '');
	};

	// Save all attributes back to block
	const handleSaveToBlock = () => {
		if (!selectedBlockId) return;

		dispatch('core/block-editor').updateBlockAttributes(selectedBlockId, {
			globalAttrs: attributes
		});

		onClose();
	};

	// Handle escape key
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const attributeKeys = Object.keys(attributes);

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					zIndex: 999999,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '20px'
				}}
				onClick={onClose}
			>
				<motion.div
					initial={{ scale: 0.95, y: 20 }}
					animate={{ scale: 1, y: 0 }}
					exit={{ scale: 0.95, y: 20 }}
					transition={{ duration: 0.2 }}
					onClick={(e) => e.stopPropagation()}
					style={{
						width: '100%',
						maxWidth: '1400px',
						height: '90vh',
						backgroundColor: '#1e1e1e',
						borderRadius: '8px',
						display: 'flex',
						overflow: 'hidden',
						boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
					}}
				>
					{/* Sidebar - List of attributes */}
					<div style={{
						width: '300px',
						borderRight: '1px solid #333',
						display: 'flex',
						flexDirection: 'column',
						backgroundColor: '#252525'
					}}>
						{/* Sidebar Header */}
						<div style={{
							padding: '16px 20px',
							borderBottom: '1px solid #333'
						}}>
							<h3 style={{
								margin: 0,
								fontSize: '14px',
								fontWeight: '600',
								color: '#fff',
								textTransform: 'uppercase',
								letterSpacing: '0.5px'
							}}>
								{__('Attributes', 'universal-block')}
							</h3>
							<p style={{
								margin: '4px 0 0 0',
								fontSize: '11px',
								color: '#999'
							}}>
								{attributeKeys.length} {attributeKeys.length === 1 ? 'attribute' : 'attributes'}
							</p>
						</div>

						{/* Attribute List */}
						<div style={{
							flex: 1,
							overflow: 'auto',
							padding: '8px'
						}}>
							{attributeKeys.length === 0 ? (
								<div style={{
									padding: '20px',
									textAlign: 'center',
									color: '#666',
									fontSize: '12px'
								}}>
									No attributes yet.<br />Add one below.
								</div>
							) : (
								attributeKeys.map(key => (
									<div
										key={key}
										onClick={() => handleSelectAttribute(key)}
										style={{
											padding: '10px 12px',
											marginBottom: '4px',
											backgroundColor: selectedKey === key ? '#007cba' : '#2a2a2a',
											borderRadius: '4px',
											cursor: 'pointer',
											transition: 'all 0.2s',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center'
										}}
										onMouseEnter={(e) => {
											if (selectedKey !== key) {
												e.currentTarget.style.backgroundColor = '#333';
											}
										}}
										onMouseLeave={(e) => {
											if (selectedKey !== key) {
												e.currentTarget.style.backgroundColor = '#2a2a2a';
											}
										}}
									>
										<div style={{ flex: 1, minWidth: 0 }}>
											<div style={{
												fontSize: '12px',
												fontWeight: '600',
												color: '#fff',
												marginBottom: '2px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap'
											}}>
												{key}
											</div>
											<div style={{
												fontSize: '10px',
												color: selectedKey === key ? '#cce7ff' : '#999',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap'
											}}>
												{attributes[key] || '(empty)'}
											</div>
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteAttribute(key);
											}}
											style={{
												background: 'transparent',
												border: 'none',
												color: selectedKey === key ? '#fff' : '#666',
												cursor: 'pointer',
												padding: '4px',
												display: 'flex',
												alignItems: 'center',
												marginLeft: '8px'
											}}
											title="Delete attribute"
										>
											<RemixIcon name="delete-bin-line" size={14} />
										</button>
									</div>
								))
							)}
						</div>

						{/* Add New Attribute Button */}
						<div style={{
							padding: '12px',
							borderTop: '1px solid #333'
						}}>
							<button
								onClick={() => {
									setSelectedKey(null);
									setKeyInput('');
									setValueInput('');
								}}
								style={{
									width: '100%',
									padding: '8px',
									background: '#007cba',
									color: '#fff',
									border: 'none',
									borderRadius: '4px',
									cursor: 'pointer',
									fontSize: '12px',
									fontWeight: '600',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '6px'
								}}
							>
								<RemixIcon name="add-line" size={16} />
								{__('New Attribute', 'universal-block')}
							</button>
						</div>
					</div>

					{/* Main Editor Area */}
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
						{/* Header */}
						<div style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: '16px 20px',
							borderBottom: '1px solid #333',
							backgroundColor: '#252525'
						}}>
							<h2 style={{
								margin: 0,
								fontSize: '18px',
								fontWeight: '600',
								color: '#fff'
							}}>
								{selectedKey || keyInput ? __('Edit Attribute', 'universal-block') : __('Add Attribute', 'universal-block')}
							</h2>

							<div style={{ display: 'flex', gap: '8px' }}>
								<button
									onClick={handleSaveToBlock}
									style={{
										padding: '8px 16px',
										backgroundColor: '#0073aa',
										color: '#fff',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										fontSize: '14px',
										fontWeight: '500',
										display: 'flex',
										alignItems: 'center',
										gap: '6px'
									}}
								>
									<RemixIcon name="save-line" size={16} />
									{__('Save to Block', 'universal-block')}
								</button>

								<button
									onClick={onClose}
									style={{
										padding: '8px',
										backgroundColor: '#333',
										color: '#fff',
										border: '1px solid #555',
										borderRadius: '4px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}
									title={__('Close (Esc)', 'universal-block')}
								>
									<RemixIcon name="close-line" size={20} />
								</button>
							</div>
						</div>

						{/* Editor Content */}
						<div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'auto' }}>
							{/* Attribute Name Input */}
							<div style={{ marginBottom: '20px' }}>
								<label style={{
									display: 'block',
									fontSize: '12px',
									fontWeight: '600',
									color: '#ccc',
									marginBottom: '8px',
									textTransform: 'uppercase',
									letterSpacing: '0.5px'
								}}>
									{__('Attribute Name', 'universal-block')}
								</label>
								<input
									type="text"
									value={keyInput}
									onChange={(e) => setKeyInput(e.target.value)}
									placeholder="e.g., x-data, @click, data-value"
									style={{
										width: '100%',
										padding: '10px 12px',
										backgroundColor: '#2a2a2a',
										color: '#fff',
										border: '1px solid #444',
										borderRadius: '4px',
										fontSize: '14px',
										fontFamily: 'Monaco, Menlo, monospace'
									}}
								/>
								<p style={{
									margin: '6px 0 0 0',
									fontSize: '11px',
									color: '#999'
								}}>
									Perfect for Alpine.js (x-data, @click), HTMX (hx-get), or any custom attribute
								</p>
							</div>

							{/* Attribute Value Editor */}
							<div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
								<label style={{
									display: 'block',
									fontSize: '12px',
									fontWeight: '600',
									color: '#ccc',
									marginBottom: '8px',
									textTransform: 'uppercase',
									letterSpacing: '0.5px'
								}}>
									{__('Attribute Value', 'universal-block')}
								</label>
								<div style={{ flex: 1, minHeight: 0 }}>
									<AceEditor
										value={valueInput}
										onChange={setValueInput}
										mode="html"
										theme="monokai"
										height="100%"
									/>
								</div>
							</div>

							{/* Save Attribute Button */}
							<div style={{ marginTop: '20px' }}>
								<button
									onClick={handleSaveAttribute}
									style={{
										padding: '10px 20px',
										background: '#007cba',
										color: '#fff',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
										fontSize: '14px',
										fontWeight: '600',
										display: 'flex',
										alignItems: 'center',
										gap: '8px'
									}}
								>
									<RemixIcon name="check-line" size={18} />
									{selectedKey ? __('Update Attribute', 'universal-block') : __('Add Attribute', 'universal-block')}
								</button>
							</div>
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
