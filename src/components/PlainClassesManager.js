import { __ } from '@wordpress/i18n';
import { useState, useRef, useEffect } from '@wordpress/element';
import { Icon } from '@wordpress/components';

/**
 * Plain Classes Manager
 *
 * Tokenized class management that's always visible when block is selected.
 * Clean, minimal UI for quick class addition/removal.
 */
export default function PlainClassesManager({ className = '', onChange }) {
	const [inputValue, setInputValue] = useState('');
	const inputRef = useRef(null);

	// Parse className string into array of class tokens
	const classes = className ? className.split(' ').filter(c => c.trim()) : [];

	const handleAddClass = () => {
		if (!inputValue.trim()) return;

		// Split by space to handle multiple classes pasted at once
		const newClasses = inputValue.trim().split(/\s+/).filter(c => c);

		// Combine with existing classes and remove duplicates
		const allClasses = [...classes, ...newClasses];
		const uniqueClasses = [...new Set(allClasses)];

		onChange(uniqueClasses.join(' '));
		setInputValue('');

		// Keep focus on input
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const handleRemoveClass = (classToRemove) => {
		const newClasses = classes.filter(c => c !== classToRemove);
		onChange(newClasses.join(' '));
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAddClass();
		} else if (e.key === 'Backspace' && !inputValue && classes.length > 0) {
			// Remove last class if backspace on empty input
			handleRemoveClass(classes[classes.length - 1]);
		}
	};

	return (
		<div style={{
			background: '#fff'
		}}>
			{/* Label */}
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				marginBottom: '10px'
			}}>
				<label style={{
					fontSize: '11px',
					fontWeight: '600',
					color: '#1e1e1e',
					textTransform: 'uppercase',
					letterSpacing: '0.5px'
				}}>
					Classes
				</label>
				{classes.length > 0 && (
					<span style={{
						fontSize: '11px',
						color: '#666',
						background: '#f0f0f0',
						padding: '2px 8px',
						borderRadius: '10px'
					}}>
						{classes.length}
					</span>
				)}
			</div>

			{/* Class Tokens */}
			<div style={{
				display: 'flex',
				flexWrap: 'wrap',
				gap: '8px',
				minHeight: '40px',
				padding: '10px',
				background: '#f9f9f9',
				borderRadius: '4px',
				border: '1px solid #ddd',
				cursor: 'text'
			}}
			onClick={() => inputRef.current?.focus()}
			>
				{classes.map((cls, index) => (
					<div
						key={index}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							background: '#2271b1',
							color: '#fff',
							padding: '6px 10px',
							borderRadius: '4px',
							fontSize: '12px',
							fontFamily: 'Monaco, Menlo, monospace',
							lineHeight: '1.2',
							height: 'fit-content'
						}}
					>
						<span>{cls}</span>
						<button
							onClick={(e) => {
								e.stopPropagation();
								handleRemoveClass(cls);
							}}
							style={{
								background: 'transparent',
								border: 'none',
								color: '#fff',
								cursor: 'pointer',
								padding: '0',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: '14px',
								height: '14px',
								borderRadius: '50%',
								opacity: 0.8
							}}
							onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
							onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
							aria-label={__('Remove class', 'universal-block')}
						>
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
								<path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
							</svg>
						</button>
					</div>
				))}

				{/* Input */}
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleAddClass}
					placeholder={classes.length === 0 ? 'Type class name and press Enter...' : ''}
					style={{
						flex: 1,
						minWidth: '140px',
						border: 'none',
						background: 'transparent',
						outline: 'none',
						fontSize: '13px',
						fontFamily: 'Monaco, Menlo, monospace',
						padding: '6px',
						color: '#1e1e1e'
					}}
				/>
			</div>

			{/* Helper Text */}
			<div style={{
				marginTop: '8px',
				fontSize: '11px',
				color: '#666',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				gap: '12px'
			}}>
				<span style={{ flex: 1 }}>Press Enter to add • Backspace to remove last</span>
				{classes.length > 0 && (
					<button
						onClick={() => onChange('')}
						style={{
							background: 'transparent',
							border: 'none',
							color: '#d63638',
							cursor: 'pointer',
							fontSize: '11px',
							padding: '4px 8px',
							textDecoration: 'underline',
							whiteSpace: 'nowrap'
						}}
					>
						Clear all
					</button>
				)}
			</div>
		</div>
	);
}
