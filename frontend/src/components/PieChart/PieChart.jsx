import './pie.css'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

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
    cutout: '50%',
};

export default function PieChart({ data, options = defaultOptions }) {
    return <Doughnut
        data={data}
        options={options}
    />
}