import React, { useState, useEffect } from 'react';
import DragAndDrop from './components/DragAndDrop';
import TableDisplay from './components/TableDisplay';
import ExportButton from './components/ExportButton';
import ThemeToggle from './components/ThemeToggle';
import { getUpgradeParents, llmUpgradeSummary } from './utils/aiAnalysis';
import './styles/theme.css';
// Generic Accordion for multiple sections
type AccordionSection = {
    title: string;
    content: React.ReactNode;
};

const MultiAccordion: React.FC<{ sections: AccordionSection[] }> = ({ sections }) => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(0);
    return (
        <div style={{ margin: '24px 0', maxWidth: 900, width: '100%' }}>
            {sections.map((section, idx) => (
                <div key={section.title} style={{ marginBottom: 12, borderRadius: 8, border: '1px solid #bbb', background: '#fff', boxShadow: '0 2px 8px #0001' }}>
                    <div
                        style={{
                            cursor: 'pointer',
                            padding: '14px 20px',
                            fontWeight: 700,
                            background: openIndex === idx ? '#e3f2fd' : '#f7fafc',
                            borderRadius: '8px 8px 0 0',
                            borderBottom: openIndex === idx ? '1px solid #bbb' : 'none',
                            fontSize: 18,
                            transition: 'background 0.2s',
                        }}
                        onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    >
                        {section.title}
                        <span style={{ float: 'right', fontWeight: 400, fontSize: 20 }}>
                            {openIndex === idx ? '▲' : '▼'}
                        </span>
                    </div>
                    {openIndex === idx && (
                        <div style={{ padding: '18px 24px', background: '#f9f9f9', borderRadius: '0 0 8px 8px', fontSize: 16, maxHeight: 350, overflowY: 'auto' }}>
                            {section.content}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
// Accordion UI for minimal upgrade summary
type AccordionItem = { parent: string, packages: string[] };

const AccordionList: React.FC<{ items: AccordionItem[] }> = ({ items }) => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);
    if (!items.length) return <div>No actionable parent upgrades detected.</div>;
    return (
        <div style={{ marginTop: 10 }}>
            {items.map((item, idx) => (
                <div key={item.parent} style={{ marginBottom: 8, borderRadius: 6, border: '1px solid #bbb', background: '#fff' }}>
                    <div
                        style={{
                            cursor: 'pointer',
                            padding: '10px 14px',
                            fontWeight: 600,
                            background: openIndex === idx ? '#e3f2fd' : '#f7fafc',
                            borderRadius: '6px 6px 0 0',
                            borderBottom: openIndex === idx ? '1px solid #bbb' : 'none',
                            transition: 'background 0.2s',
                        }}
                        onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    >
                        {item.parent}
                        <span style={{ float: 'right', fontWeight: 400, fontSize: 18 }}>
                            {openIndex === idx ? '▲' : '▼'}
                        </span>
                    </div>
                    {openIndex === idx && (
                        <div style={{ padding: '10px 18px', background: '#f9f9f9', borderRadius: '0 0 6px 6px', fontSize: 15 }}>
                            <div><b>Affected packages:</b></div>
                            <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                                {item.packages.map(pkg => (
                                    <li key={pkg} style={{ marginBottom: 2 }}>{pkg}</li>
                                ))}
                            </ul>
                            <div style={{ marginTop: 8, color: '#1976d2' }}>
                                <b>Recommendation:</b> Upgrade <b>{item.parent}</b> to the latest safe version.
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
const App: React.FC = () => {
    const [data, setData] = React.useState<any[]>([]);
    const [upgradeParents, setUpgradeParents] = React.useState<any[]>([]);
    const [llmSummary, setLlmSummary] = React.useState<string>('');
    const [apiKey, setApiKey] = React.useState<string>('');
    const [isDarkTheme, setIsDarkTheme] = React.useState<boolean>(false);
    const [loadingLlm, setLoadingLlm] = React.useState<boolean>(false);

    const handleDataChange = (newData: any[]) => {
        setData(newData);
        setUpgradeParents(getUpgradeParents(newData));
        setLlmSummary('');
    };

    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
    };

    const handleLlmSummary = async () => {
        if (!apiKey) {
            setLlmSummary('Please enter your OpenAI API key.');
            return;
        }
        setLoadingLlm(true);
        try {
            const result = await llmUpgradeSummary(data, apiKey);
            setLlmSummary(result);
        } catch (err) {
            setLlmSummary('Error generating LLM summary.');
        }
        setLoadingLlm(false);
    };

    React.useEffect(() => {
        const prevent = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener('dragover', prevent);
        window.addEventListener('drop', prevent);
        return () => {
            window.removeEventListener('dragover', prevent);
            window.removeEventListener('drop', prevent);
        };
    }, []);

    return (
        <div className={isDarkTheme ? 'black-theme' : 'white-theme'}>
            <div className="container" style={{ maxWidth: 950, margin: '0 auto', padding: 24 }}>
                <ThemeToggle toggleTheme={toggleTheme} />
                <DragAndDrop onFileDrop={handleDataChange} />
                <MultiAccordion
                    sections={[
                        {
                            title: 'Minimal Upgrade Summary',
                            content: upgradeParents.length > 0 ? <AccordionList items={upgradeParents} /> : <div>No data available.</div>,
                        },
                        {
                            title: 'LLM-powered Summary (OpenAI)',
                            content: data.length > 0 ? (
                                <div>
                                    <input
                                        type="password"
                                        placeholder="Enter OpenAI API Key"
                                        value={apiKey}
                                        onChange={e => setApiKey(e.target.value)}
                                        style={{width: 260, marginRight: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc'}}
                                    />
                                    <button
                                        onClick={handleLlmSummary}
                                        disabled={loadingLlm || !apiKey}
                                        style={{padding: '4px 12px', borderRadius: 4, border: 'none', background: '#1976d2', color: '#fff', cursor: 'pointer'}}
                                    >
                                        {loadingLlm ? 'Generating...' : 'Generate LLM Summary'}
                                    </button>
                                    {llmSummary && (
                                        <div style={{marginTop: 12, whiteSpace: 'pre-line'}}>{llmSummary}</div>
                                    )}
                                </div>
                            ) : <div>No data available.</div>,
                        },
                        {
                            title: 'Vulnerability Table',
                            content: <div><TableDisplay data={data} /><ExportButton data={data} /></div>,
                        },
                    ]}
                />
            </div>
        </div>
    );
};

export default App;