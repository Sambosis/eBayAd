import React, { useState, useEffect } from 'react';

interface TutorialStep {
    target: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        target: 'welcome',
        title: 'Welcome to AdSpark AI!',
        description: 'Let\'s take a quick tour to help you create stunning product ads in minutes using AI.',
        position: 'bottom'
    },
    {
        target: 'image-uploader',
        title: 'Step 1: Upload Your Product Image',
        description: 'Start by uploading a clear photo of your product. Our AI will automatically identify it and extract key details.',
        position: 'right'
    },
    {
        target: 'product-info',
        title: 'Step 2: Review & Edit Product Info',
        description: 'The AI will generate a product name and description suitable for any online marketplace. You can edit these or regenerate them if needed.',
        position: 'right'
    },
    {
        target: 'ad-styles',
        title: 'Step 3: Generate Ad Styles',
        description: 'Choose from preset styles or get AI suggestions. Click "Generate All" to create ads in every style, or select individual styles.',
        position: 'left'
    },
    {
        target: 'history-button',
        title: 'Save Your Work',
        description: 'Don\'t forget to save your session to History so you can come back to it later!',
        position: 'bottom'
    },
    {
        target: 'keyboard-shortcuts',
        title: 'Pro Tip: Keyboard Shortcuts',
        description: 'Press "G" to generate all ads quickly, or "S" to save to history. Happy creating!',
        position: 'bottom'
    }
];

interface TutorialOverlayProps {
    onComplete: () => void;
    onSkip: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete, onSkip }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetPosition, setTargetPosition] = useState<DOMRect | null>(null);

    const currentTutorialStep = TUTORIAL_STEPS[currentStep];
    const isWelcomeStep = currentTutorialStep.target === 'welcome';

    useEffect(() => {
        if (isWelcomeStep) {
            setTargetPosition(null);
            return;
        }

        const updatePosition = () => {
            const element = document.querySelector(`[data-tutorial="${currentTutorialStep.target}"]`);
            if (element) {
                setTargetPosition(element.getBoundingClientRect());
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [currentStep, currentTutorialStep, isWelcomeStep]);

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const getTooltipPosition = () => {
        if (!targetPosition || isWelcomeStep) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            };
        }

        const { position } = currentTutorialStep;
        const padding = 20;
        const tooltipWidth = 448; // max-w-md = 28rem = 448px
        const tooltipHeight = 300; // estimated height

        let style: React.CSSProperties = {};

        switch (position) {
            case 'top':
                style = {
                    top: `${targetPosition.top - padding}px`,
                    left: `${targetPosition.left + targetPosition.width / 2}px`,
                    transform: 'translate(-50%, -100%)'
                };
                break;
            case 'bottom':
                style = {
                    top: `${targetPosition.bottom + padding}px`,
                    left: `${targetPosition.left + targetPosition.width / 2}px`,
                    transform: 'translate(-50%, 0)'
                };
                break;
            case 'left':
                style = {
                    top: `${targetPosition.top + targetPosition.height / 2}px`,
                    left: `${targetPosition.left - padding}px`,
                    transform: 'translate(-100%, -50%)'
                };
                break;
            case 'right':
                style = {
                    top: `${targetPosition.top + targetPosition.height / 2}px`,
                    left: `${targetPosition.right + padding}px`,
                    transform: 'translate(0, -50%)'
                };
                break;
        }

        // Adjust if tooltip would go off screen
        const left = parseFloat(style.left as string);
        const top = parseFloat(style.top as string);

        // Check right edge
        if (position === 'bottom' || position === 'top') {
            if (left + tooltipWidth / 2 > window.innerWidth) {
                style.left = `${window.innerWidth - tooltipWidth - padding}px`;
                style.transform = 'translate(0, ' + (position === 'top' ? '-100%' : '0') + ')';
            } else if (left - tooltipWidth / 2 < 0) {
                style.left = `${padding}px`;
                style.transform = 'translate(0, ' + (position === 'top' ? '-100%' : '0') + ')';
            }
        }

        // Check bottom edge
        if (position === 'bottom' && top + tooltipHeight > window.innerHeight) {
            // Switch to top position if bottom would overflow
            style.top = `${targetPosition.top - padding}px`;
            style.transform = style.transform.replace('0)', '-100%)');
        }

        return style;
    };

    const getHighlightStyle = () => {
        if (!targetPosition || isWelcomeStep) return {};

        return {
            top: `${targetPosition.top - 8}px`,
            left: `${targetPosition.left - 8}px`,
            width: `${targetPosition.width + 16}px`,
            height: `${targetPosition.height + 16}px`
        };
    };

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* SVG Overlay with cutout */}
            <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={onSkip}>
                <defs>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {!isWelcomeStep && targetPosition && (
                            <rect
                                x={targetPosition.left - 8}
                                y={targetPosition.top - 8}
                                width={targetPosition.width + 16}
                                height={targetPosition.height + 16}
                                rx="8"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.85)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            {/* Highlight border */}
            {!isWelcomeStep && targetPosition && (
                <div
                    className="absolute border-4 border-indigo-400 rounded-lg pointer-events-none transition-all duration-300 shadow-xl"
                    style={getHighlightStyle()}
                />
            )}

            {/* Tooltip */}
            <div
                className="absolute z-10 max-w-md transition-all duration-300 pointer-events-auto"
                style={getTooltipPosition()}
            >
                <div className={`bg-slate-900 border-2 border-indigo-500 rounded-xl p-6 shadow-2xl ${isWelcomeStep ? 'min-w-[500px]' : ''}`}>
                    {/* Progress indicator */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-1.5">
                            {TUTORIAL_STEPS.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-1.5 rounded-full transition-all ${
                                        index === currentStep
                                            ? 'w-8 bg-indigo-400'
                                            : index < currentStep
                                            ? 'w-1.5 bg-indigo-600'
                                            : 'w-1.5 bg-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={onSkip}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Skip Tour
                        </button>
                    </div>

                    {/* Content */}
                    {isWelcomeStep && (
                        <div className="flex justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-indigo-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                        </div>
                    )}

                    <h3 className="text-xl font-bold text-white mb-2">
                        {currentTutorialStep.title}
                    </h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                        {currentTutorialStep.description}
                    </p>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className="px-4 py-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-500">
                            {currentStep + 1} of {TUTORIAL_STEPS.length}
                        </span>
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
                        >
                            {currentStep === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialOverlay;
