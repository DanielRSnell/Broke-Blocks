import React, { useState, useEffect, useRef } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';

const FloatingStylePanel = ({ isOpen, onClose }) => {
	const [position, setPosition] = useState(() => {
		const saved = localStorage.getItem('universalBlockStylePanelPosition');
		return saved ? JSON.parse(saved) : { x: 100, y: 100 };
	});
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [classInput, setClassInput] = useState('');
	const [autocompleteFilter, setAutocompleteFilter] = useState('');
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
	const panelRef = useRef(null);
	const inputRef = useRef(null);
	const autocompleteRef = useRef(null);

	// PERFORMANCE: Only subscribe to block selection when panel is open
	// This prevents unnecessary re-renders on every block selection in the editor
	const { selectedBlock, selectedBlockId } = useSelect((select) => {
		if (!isOpen) {
			return { selectedBlockId: null, selectedBlock: null };
		}

		const blockEditor = select('core/block-editor');
		const selectedId = blockEditor.getSelectedBlockClientId();
		return {
			selectedBlockId: selectedId,
			selectedBlock: selectedId ? blockEditor.getBlock(selectedId) : null
		};
	}, [isOpen]);

	const { updateBlockAttributes } = useDispatch('core/block-editor');

	// Update input when block selection changes
	useEffect(() => {
		if (selectedBlock && selectedBlock.name === 'universal/element') {
			const className = selectedBlock.attributes?.className || '';
			setClassInput(className);
		} else {
			setClassInput('');
		}
	}, [selectedBlockId, selectedBlock]);

	// Save position to localStorage
	useEffect(() => {
		localStorage.setItem('universalBlockStylePanelPosition', JSON.stringify(position));
	}, [position]);

	// Handle dragging
	const handleMouseDown = (e) => {
		if (e.target.classList.contains('style-panel-header')) {
			setIsDragging(true);
			setDragOffset({
				x: e.clientX - position.x,
				y: e.clientY - position.y
			});
		}
	};

	const handleMouseMove = (e) => {
		if (isDragging) {
			setPosition({
				x: e.clientX - dragOffset.x,
				y: e.clientY - dragOffset.y
			});
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, dragOffset]);

	// Tailwind autocomplete suggestions (subset for demonstration)
	const tailwindClasses = [
		// Layout
		'flex', 'flex-row', 'flex-col', 'grid', 'block', 'inline-block', 'inline', 'hidden',
		// Flexbox
		'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around',
		'items-start', 'items-end', 'items-center', 'items-stretch',
		'flex-wrap', 'flex-nowrap', 'gap-1', 'gap-2', 'gap-4', 'gap-6', 'gap-8',
		// Spacing
		'p-0', 'p-1', 'p-2', 'p-4', 'p-6', 'p-8', 'p-10', 'p-12',
		'm-0', 'm-1', 'm-2', 'm-4', 'm-6', 'm-8', 'm-10', 'm-12',
		'mx-auto', 'my-auto',
		// Sizing
		'w-full', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
		'h-full', 'h-screen', 'h-auto',
		'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl',
		// Typography
		'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
		'font-normal', 'font-medium', 'font-semibold', 'font-bold',
		'text-left', 'text-center', 'text-right',
		// Colors
		'bg-white', 'bg-black', 'bg-gray-100', 'bg-gray-200', 'bg-gray-500',
		'text-white', 'text-black', 'text-gray-600', 'text-gray-800',
		// Border
		'border', 'border-2', 'border-4', 'rounded', 'rounded-lg', 'rounded-full',
		// Effects
		'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl',
		'opacity-0', 'opacity-50', 'opacity-100',
		// Responsive
		'sm:flex', 'md:flex', 'lg:flex', 'xl:flex',
		'sm:hidden', 'md:hidden', 'lg:hidden', 'xl:hidden'
	];

	// Filter classes based on current input
	const filteredClasses = autocompleteFilter
		? tailwindClasses.filter(cls => cls.includes(autocompleteFilter)).slice(0, 20)
		: tailwindClasses.slice(0, 20);

	// Reset selection index when filter changes
	useEffect(() => {
		setSelectedSuggestionIndex(0);
	}, [autocompleteFilter, filteredClasses.length]);

	// Scroll selected suggestion into view
	useEffect(() => {
		if (autocompleteRef.current) {
			const selectedElement = autocompleteRef.current.children[selectedSuggestionIndex + 1]; // +1 for header
			if (selectedElement) {
				selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}, [selectedSuggestionIndex]);

	// Handle class input change
	const handleClassChange = (e) => {
		const value = e.target.value;
		setClassInput(value);

		// Update block in real-time
		if (selectedBlockId && selectedBlock?.name === 'universal/element') {
			updateBlockAttributes(selectedBlockId, { className: value });
		}

		// Get current word for autocomplete
		const cursorPos = e.target.selectionStart;
		const textBeforeCursor = value.substring(0, cursorPos);
		const words = textBeforeCursor.split(/\s+/);
		const currentWord = words[words.length - 1];

		setAutocompleteFilter(currentWord || '');
	};

	// Insert class from autocomplete
	const handleAutocompleteSelect = (className) => {
		const cursorPos = inputRef.current.selectionStart;
		const textBeforeCursor = classInput.substring(0, cursorPos);
		const textAfterCursor = classInput.substring(cursorPos);

		// Replace the last partial word with the selected class
		const words = textBeforeCursor.split(/\s+/);
		words[words.length - 1] = className;

		const newValue = words.join(' ') + ' ' + textAfterCursor;
		setClassInput(newValue);

		if (selectedBlockId && selectedBlock?.name === 'universal/element') {
			updateBlockAttributes(selectedBlockId, { className: newValue });
		}

		setAutocompleteFilter('');
		inputRef.current.focus();

		// Move cursor to after inserted class
		setTimeout(() => {
			const newCursorPos = words.join(' ').length + 1;
			inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	};

	// Keyboard navigation for autocomplete
	const handleKeyDown = (e) => {
		if (filteredClasses.length === 0) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setSelectedSuggestionIndex(prev =>
					prev < filteredClasses.length - 1 ? prev + 1 : prev
				);
				break;

			case 'ArrowUp':
				e.preventDefault();
				setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
				break;

			case 'Enter':
				if (filteredClasses[selectedSuggestionIndex]) {
					e.preventDefault();
					handleAutocompleteSelect(filteredClasses[selectedSuggestionIndex]);
				}
				break;

			case 'Escape':
				e.preventDefault();
				setAutocompleteFilter('');
				break;

			case 'Tab':
				if (filteredClasses[selectedSuggestionIndex]) {
					e.preventDefault();
					handleAutocompleteSelect(filteredClasses[selectedSuggestionIndex]);
				}
				break;
		}
	};

	if (!isOpen) return null;

	return (
		<div
			ref={panelRef}
			className="universal-floating-style-panel"
			style={{
				position: 'fixed',
				left: `${position.x}px`,
				top: `${position.y}px`,
				zIndex: 100000,
				width: '680px',
				backgroundColor: '#fff',
				border: '1px solid #ddd',
				borderRadius: '4px',
				boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
				cursor: isDragging ? 'grabbing' : 'default'
			}}
		>
			{/* Header */}
			<div
				className="style-panel-header"
				onMouseDown={handleMouseDown}
				style={{
					padding: '12px 16px',
					backgroundColor: '#f8f9fa',
					borderBottom: '1px solid #ddd',
					cursor: 'grab',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					userSelect: 'none'
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path d="M5.00006 3L4.35006 6.34H17.9401L17.5001 8.5H3.92006L3.26006 11.83H16.8501L16.0901 15.64L10.6101 17.45L5.86006 15.64L6.19006 14H2.85006L2.06006 18L9.91006 21L18.9601 18L20.1601 11.97L20.4001 10.76L21.9401 3H5.00006Z"></path>
					</svg>
					<strong style={{ fontSize: '14px' }}>Style Panel</strong>
				</div>
				<button
					onClick={onClose}
					style={{
						border: 'none',
						background: 'transparent',
						cursor: 'pointer',
						padding: '4px',
						display: 'flex',
						alignItems: 'center'
					}}
					aria-label="Close Style Panel"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
					</svg>
				</button>
			</div>

			{/* Body */}
			<div style={{ padding: '16px', display: 'flex', gap: '12px' }}>
				{/* Main input area */}
				<div style={{ flex: 1 }}>
					{selectedBlock?.name === 'universal/element' ? (
						<>
							<label style={{
								display: 'block',
								fontSize: '12px',
								fontWeight: '500',
								marginBottom: '8px',
								color: '#1e1e1e'
							}}>
								CSS Classes
							</label>
							<textarea
								ref={inputRef}
								value={classInput}
								onChange={handleClassChange}
								onKeyDown={handleKeyDown}
								placeholder="Enter CSS classes separated by spaces..."
								style={{
									width: '100%',
									minHeight: '120px',
									padding: '8px',
									border: '1px solid #ddd',
									borderRadius: '4px',
									fontSize: '13px',
									fontFamily: 'monospace',
									resize: 'vertical'
								}}
								aria-label="CSS Classes Input"
								aria-describedby="class-count-info keyboard-help"
							/>
							<div style={{
								marginTop: '8px',
								fontSize: '11px',
								color: '#757575',
								display: 'flex',
								justifyContent: 'space-between'
							}}>
								<span id="class-count-info">
									{classInput.split(/\s+/).filter(c => c).length} classes
								</span>
								<span id="keyboard-help" style={{ fontStyle: 'italic' }}>
									↑↓ navigate • Enter/Tab insert • Esc clear
								</span>
							</div>
						</>
					) : (
						<div style={{
							padding: '24px',
							textAlign: 'center',
							color: '#757575',
							fontSize: '13px'
						}}>
							Select a Universal Element block to edit classes
						</div>
					)}
				</div>

				{/* Autocomplete sidebar - always visible */}
				<div
					ref={autocompleteRef}
					style={{
						width: '220px',
						maxHeight: '300px',
						overflowY: 'auto',
						border: '1px solid #ddd',
						borderRadius: '4px',
						backgroundColor: '#fafafa'
					}}
					role="listbox"
					aria-label="Class suggestions"
				>
					<div style={{
						padding: '8px',
						fontSize: '11px',
						fontWeight: '600',
						color: '#666',
						borderBottom: '1px solid #ddd',
						backgroundColor: '#f0f0f0',
						position: 'sticky',
						top: 0
					}}>
						SUGGESTIONS {autocompleteFilter && `(${filteredClasses.length})`}
					</div>
					{filteredClasses.map((cls, index) => (
						<button
							key={cls}
							onClick={() => handleAutocompleteSelect(cls)}
							role="option"
							aria-selected={index === selectedSuggestionIndex}
							style={{
								display: 'block',
								width: '100%',
								textAlign: 'left',
								padding: '8px 12px',
								border: 'none',
								backgroundColor: index === selectedSuggestionIndex ? '#007cba' : 'transparent',
								color: index === selectedSuggestionIndex ? '#fff' : '#1e1e1e',
								cursor: 'pointer',
								fontSize: '12px',
								fontFamily: 'monospace',
								transition: 'background-color 0.1s, color 0.1s'
							}}
							onMouseEnter={() => setSelectedSuggestionIndex(index)}
						>
							{cls}
						</button>
					))}
					{filteredClasses.length === 0 && (
						<div style={{
							padding: '16px',
							textAlign: 'center',
							color: '#999',
							fontSize: '12px',
							fontStyle: 'italic'
						}}>
							No matching classes
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default FloatingStylePanel;
