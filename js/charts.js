// ============================================
// ApexCharts Wrapper Functions
// ============================================

const Charts = {
  defaultOptions: {
    chart: {
      background: 'transparent',
      toolbar: { show: true, tools: { download: true, selection: false, zoom: true, zoomin: true, zoomout: true, pan: false, reset: true } },
      fontFamily: 'Inter, sans-serif',
    },
    theme: { mode: 'dark' },
    grid: {
      borderColor: 'rgba(255,255,255,0.06)',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '13px' },
    },
    colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  },

  // Multi-axis timeline: CapEx (bar) + Market Cap (line) + Employees (line)
  createMultiAxisChart(containerId, company) {
    const years = company.historical.years;
    const capexData = company.historical.capex.map(v => v ?? 0);
    const aiCapexData = company.historical.aiCapex.map(v => v ?? 0);
    const marketCapData = company.historical.marketCap.map(v => v ?? 0);
    const employeeData = company.historical.employees.map(v => v ?? 0);

    const options = {
      ...this.defaultOptions,
      chart: {
        ...this.defaultOptions.chart,
        type: 'line',
        height: 380,
      },
      series: [
        { name: 'AI CapEx ($B)', type: 'column', data: aiCapexData },
        { name: 'Total CapEx ($B)', type: 'column', data: capexData },
        { name: 'Market Cap ($B)', type: 'line', data: marketCapData },
        { name: 'Employees', type: 'line', data: employeeData },
      ],
      stroke: { width: [0, 0, 3, 3], curve: 'smooth' },
      plotOptions: {
        bar: { columnWidth: '40%', borderRadius: 4 },
      },
      colors: ['#7c3aed', '#4c1d95', '#3b82f6', '#10b981'],
      fill: {
        opacity: [0.9, 0.4, 1, 1],
      },
      xaxis: {
        categories: years,
        labels: { style: { colors: '#6b6b80', fontSize: '12px' } },
      },
      yaxis: [
        {
          title: { text: 'CapEx ($B)', style: { color: '#7c3aed' } },
          labels: { style: { colors: '#7c3aed' }, formatter: v => `$${v.toFixed(0)}B` },
        },
        { show: false },
        {
          opposite: true,
          title: { text: 'Market Cap ($B)', style: { color: '#3b82f6' } },
          labels: { style: { colors: '#3b82f6' }, formatter: v => `$${v.toFixed(0)}B` },
        },
        {
          opposite: true,
          title: { text: 'Employees', style: { color: '#10b981' } },
          labels: { style: { colors: '#10b981' }, formatter: v => Format.compact(v) },
          show: false,
        },
      ],
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        labels: { colors: '#a0a0b8' },
      },
      tooltip: {
        ...this.defaultOptions.tooltip,
        shared: true,
        intersect: false,
        y: {
          formatter: function(val, { seriesIndex }) {
            if (seriesIndex === 3) return Format.compact(val);
            return `$${val.toFixed(1)}B`;
          }
        }
      },
    };

    const chart = new ApexCharts(document.querySelector(`#${containerId}`), options);
    chart.render();
    return chart;
  },

  // Revenue vs AI Investment scatter/line
  createRevenueVsAI(containerId, company) {
    const years = company.historical.years;
    const aiCapex = company.historical.aiCapex;
    const revenue = company.historical.revenue;

    const options = {
      ...this.defaultOptions,
      chart: {
        ...this.defaultOptions.chart,
        type: 'line',
        height: 320,
      },
      series: [
        { name: 'AI CapEx ($B)', data: aiCapex.map(v => v ?? 0) },
        { name: 'Revenue ($B)', data: revenue.map(v => v ?? 0) },
      ],
      stroke: { width: 3, curve: 'smooth' },
      colors: ['#7c3aed', '#f59e0b'],
      markers: { size: 6, strokeWidth: 0 },
      xaxis: {
        categories: years,
        labels: { style: { colors: '#6b6b80' } },
      },
      yaxis: [
        {
          title: { text: 'AI CapEx ($B)', style: { color: '#7c3aed' } },
          labels: { style: { colors: '#7c3aed' }, formatter: v => `$${v.toFixed(1)}B` },
        },
        {
          opposite: true,
          title: { text: 'Revenue ($B)', style: { color: '#f59e0b' } },
          labels: { style: { colors: '#f59e0b' }, formatter: v => `$${v.toFixed(0)}B` },
        },
      ],
      legend: {
        position: 'top',
        labels: { colors: '#a0a0b8' },
      },
    };

    const chart = new ApexCharts(document.querySelector(`#${containerId}`), options);
    chart.render();
    return chart;
  },

  // CapEx Breakdown Donut
  createCapexDonut(containerId, company) {
    const aiCapex = company.aiCapex || 0;
    const otherCapex = (company.totalCapex || 0) - aiCapex;

    const options = {
      chart: {
        type: 'donut',
        height: 280,
        background: 'transparent',
        fontFamily: 'Inter, sans-serif',
      },
      series: [aiCapex, Math.max(0, otherCapex)],
      labels: ['AI CapEx', 'Other CapEx'],
      colors: ['#7c3aed', '#2d2d4a'],
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: { color: '#f0f0f5' },
              value: {
                color: '#f0f0f5',
                formatter: v => `$${parseFloat(v).toFixed(1)}B`
              },
              total: {
                show: true,
                label: 'Total CapEx',
                color: '#a0a0b8',
                formatter: () => `$${company.totalCapex}B`
              }
            }
          }
        }
      },
      dataLabels: { enabled: false },
      legend: {
        position: 'bottom',
        labels: { colors: '#a0a0b8' },
      },
      stroke: { width: 0 },
      theme: { mode: 'dark' },
    };

    const chart = new ApexCharts(document.querySelector(`#${containerId}`), options);
    chart.render();
    return chart;
  },

  // Sector Comparison Bar Chart
  createSectorComparison(containerId, company, allCompanies) {
    const peers = allCompanies
      .filter(c => c.category === company.category && c.ticker !== company.ticker && c.aiCapex)
      .slice(0, 5);

    const all = [company, ...peers].sort((a, b) => (b.aiCapex || 0) - (a.aiCapex || 0));

    const options = {
      ...this.defaultOptions,
      chart: {
        ...this.defaultOptions.chart,
        type: 'bar',
        height: 300,
      },
      series: [{
        name: 'AI CapEx ($B)',
        data: all.map(c => c.aiCapex || 0),
      }],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: '60%',
          distributed: true,
        }
      },
      colors: all.map(c => c.ticker === company.ticker ? '#7c3aed' : '#2d2d4a'),
      xaxis: {
        labels: {
          style: { colors: '#6b6b80' },
          formatter: v => `$${v}B`
        },
      },
      yaxis: {
        labels: {
          style: { colors: '#a0a0b8', fontSize: '13px' },
        },
        categories: all.map(c => c.name),
      },
      // Override xaxis categories with company names
      labels: all.map(c => c.name),
      dataLabels: {
        enabled: true,
        formatter: v => `$${v}B`,
        style: { colors: ['#f0f0f5'], fontSize: '12px' },
      },
      legend: { show: false },
      tooltip: {
        y: { formatter: v => `$${v}B` },
      },
    };

    const chart = new ApexCharts(document.querySelector(`#${containerId}`), options);
    chart.render();
    return chart;
  },
};
