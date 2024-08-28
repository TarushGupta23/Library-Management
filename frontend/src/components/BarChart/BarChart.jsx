import './bar.css'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, scales } from 'chart.js/auto'

const defaultOptions = {
    plugins: {
        datalabels: {
            formatter: function (value) {
                let val = Math.round(value);
                return new Intl.NumberFormat("tr-TR").format(val);
            },
            color: "white",
        },
        legend: {
            labels: {
                color: 'white',
            }
        },
    },
    responsive: true,
    scales: {
        x: {
            ticks: { color: 'white', },
            grid: { color: '#a294e220', },
        },
        y: {
            beginAtZero: true,
            ticks: { color: 'white', },
            grid: { color: '#a294e220', },
        },
    }
}

export default function BarChart({ data, options = defaultOptions}) {
    return <Bar 
        data={data}
        options={options}
    />
}