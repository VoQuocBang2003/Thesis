<template>
  <div>
    <a-breadcrumb style="margin: 16px 0">
      <a-breadcrumb-item>Home</a-breadcrumb-item>
      <a-breadcrumb-item>Statistics</a-breadcrumb-item>
    </a-breadcrumb>

    <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
      <a-tab-pane key="dashboard" tab="Dashboard">
        <a-spin :spinning="loading">
      <a-row :gutter="16" style="margin-bottom: 24px">
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="Total Users"
              :value="stats.totalUsers"
              :value-style="{ color: '#3f8600' }"
            >
              <template #prefix>
                <UserOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="Total Products"
              :value="stats.totalProducts"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <ShoppingOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="Total Orders"
              :value="stats.totalOrders"
              :value-style="{ color: '#cf1322' }"
            >
              <template #prefix>
                <ShoppingCartOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="Total Revenue"
              :value="stats.totalRevenue"
              :precision="0"
              :value-style="{ color: '#722ed1' }"
              suffix="VNĐ"
            >
              <template #prefix>
                <DollarOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="Orders by Status">
            <a-table
              :columns="statusColumns"
              :dataSource="stats.ordersByStatus"
              :pagination="false"
              size="small"
            />
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="Top Categories">
            <a-table
              :columns="categoryColumns"
              :dataSource="stats.categoriesDistribution"
              :pagination="false"
              size="small"
            />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="Revenue by Month (Last 6 Months)">
            <div id="revenue-chart" style="height: 300px"></div>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
      </a-tab-pane>

      <!-- Revenue Management Tab -->
      <a-tab-pane key="revenue" tab="Revenue Management">
        <a-tabs v-model:activeKey="revenueSubTab" type="card">
          <!-- Revenue by Date Range -->
          <a-tab-pane key="date-range" tab="Revenue by Date Range">
            <a-card>
              <a-form layout="inline" :model="dateRangeForm" style="margin-bottom: 20px">
                <a-form-item label="From Date">
                  <a-date-picker
                    v-model:value="dateRangeForm.startDate"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    placeholder="Select start date"
                    style="width: 150px"
                  />
                </a-form-item>
                <a-form-item label="To Date">
                  <a-date-picker
                    v-model:value="dateRangeForm.endDate"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    placeholder="Select end date"
                    style="width: 150px"
                  />
                </a-form-item>
                <a-form-item>
                  <a-button type="primary" @click="fetchRevenueByDateRange" :loading="revenueLoading">
                    <SearchOutlined /> Search
                  </a-button>
                  <a-button style="margin-left: 8px" @click="resetDateRange">
                    <ReloadOutlined /> Reset
                  </a-button>
                </a-form-item>
              </a-form>

              <a-spin :spinning="revenueLoading">
                <div v-if="revenueByDateRange.summary">
                  <a-row :gutter="16" style="margin-bottom: 24px">
                    <a-col :span="6">
                      <a-statistic
                        title="Total Revenue"
                        :value="revenueByDateRange.summary.totalRevenue"
                        :precision="0"
                        suffix="VNĐ"
                        :value-style="{ color: '#3f8600' }"
                      />
                    </a-col>
                    <a-col :span="6">
                      <a-statistic
                        title="Total Discount"
                        :value="revenueByDateRange.summary.totalDiscount"
                        :precision="0"
                        suffix="VNĐ"
                        :value-style="{ color: '#cf1322' }"
                      />
                    </a-col>
                    <a-col :span="6">
                      <a-statistic
                        title="Total Orders"
                        :value="revenueByDateRange.summary.totalOrders"
                        :value-style="{ color: '#1890ff' }"
                      />
                    </a-col>
                    <a-col :span="6">
                      <a-statistic
                        title="Average Order Value"
                        :value="revenueByDateRange.summary.averageOrderValue"
                        :precision="0"
                        suffix="VNĐ"
                        :value-style="{ color: '#722ed1' }"
                      />
                    </a-col>
                  </a-row>

                  <a-table
                    :columns="revenueDateRangeColumns"
                    :dataSource="revenueByDateRange.orders"
                    :pagination="{ pageSize: 10 }"
                    rowKey="id"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'order_date'">
                        {{ formatDate(record.order_date) }}
                      </template>
                      <template v-if="column.key === 'total_price'">
                        {{ formatCurrency(record.total_price) }}
                      </template>
                      <template v-if="column.key === 'discount_amount'">
                        {{ formatCurrency(record.discount_amount || 0) }}
                      </template>
                      <template v-if="column.key === 'net_revenue'">
                        {{ formatCurrency((record.total_price || 0) - (record.discount_amount || 0)) }}
                      </template>
                    </template>
                  </a-table>
                </div>
                <a-empty v-else description="Select date range and click Search to view data" />
              </a-spin>
            </a-card>
          </a-tab-pane>

          <!-- Revenue by Product -->
          <a-tab-pane key="product" tab="Revenue by Product">
            <a-card>
              <a-form layout="inline" :model="productRevenueForm" style="margin-bottom: 20px">
                <a-form-item label="From Date">
                  <a-date-picker
                    v-model:value="productRevenueForm.startDate"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    placeholder="Select start date"
                    style="width: 150px"
                  />
                </a-form-item>
                <a-form-item label="To Date">
                  <a-date-picker
                    v-model:value="productRevenueForm.endDate"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    placeholder="Select end date"
                    style="width: 150px"
                  />
                </a-form-item>
                <a-form-item>
                  <a-button type="primary" @click="fetchRevenueByProduct" :loading="productRevenueLoading">
                    <SearchOutlined /> Search
                  </a-button>
                  <a-button style="margin-left: 8px" @click="resetProductRevenue">
                    <ReloadOutlined /> Reset
                  </a-button>
                </a-form-item>
              </a-form>

              <a-spin :spinning="productRevenueLoading">
                <a-table
                  v-if="revenueByProduct.length > 0"
                  :columns="productRevenueColumns"
                  :dataSource="revenueByProduct"
                  :pagination="{ pageSize: 10 }"
                  rowKey="id"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'image'">
                      <img :src="getImageUrl(record.image)" alt="" style="width: 50px; height: 50px; object-fit: cover" />
                    </template>
                    <template v-if="column.key === 'price'">
                      {{ formatCurrency(record.price) }}
                    </template>
                    <template v-if="column.key === 'revenue'">
                      <strong style="color: #3f8600">{{ formatCurrency(record.revenue) }}</strong>
                    </template>
                    <template v-if="column.key === 'profit'">
                      <strong style="color: #1890ff">{{ formatCurrency(record.profit || 0) }}</strong>
                    </template>
                  </template>
                </a-table>
                <a-empty v-else description="Select date range and click Search to view data" />
              </a-spin>
            </a-card>
          </a-tab-pane>

          <!-- Revenue Report -->
          <a-tab-pane key="report" tab="Revenue Report">
            <a-card>
              <a-form layout="inline" :model="reportForm" style="margin-bottom: 20px">
                <a-form-item label="From Date">
                  <a-date-picker
                    v-model:value="reportForm.startDate"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    placeholder="Select start date"
                    style="width: 150px"
                  />
                </a-form-item>
                <a-form-item label="To Date">
                  <a-date-picker
                    v-model:value="reportForm.endDate"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    placeholder="Select end date"
                    style="width: 150px"
                  />
                </a-form-item>
                <a-form-item label="Group By">
                  <a-select v-model:value="reportForm.groupBy" style="width: 120px">
                    <a-select-option value="day">Day</a-select-option>
                    <a-select-option value="week">Week</a-select-option>
                    <a-select-option value="month">Month</a-select-option>
                    <a-select-option value="year">Year</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item>
                  <a-button type="primary" @click="fetchRevenueReport" :loading="reportLoading">
                    <SearchOutlined /> Search
                  </a-button>
                  <a-button style="margin-left: 8px" @click="resetReport">
                    <ReloadOutlined /> Reset
                  </a-button>
                </a-form-item>
              </a-form>

              <a-spin :spinning="reportLoading">
                <div v-if="revenueReport.summary">
                  <a-row :gutter="16" style="margin-bottom: 24px">
                    <a-col :span="6">
                      <a-statistic
                        title="Total Revenue"
                        :value="revenueReport.summary.totalRevenue"
                        :precision="0"
                        suffix="VNĐ"
                        :value-style="{ color: '#3f8600' }"
                      />
                    </a-col>
                    <a-col :span="6">
                      <a-statistic
                        title="Total Profit"
                        :value="revenueReport.summary.totalProfit"
                        :precision="0"
                        suffix="VNĐ"
                        :value-style="{ color: '#1890ff' }"
                      />
                    </a-col>
                    <a-col :span="6">
                      <a-statistic
                        title="Total Discount"
                        :value="revenueReport.summary.totalDiscount"
                        :precision="0"
                        suffix="VNĐ"
                        :value-style="{ color: '#cf1322' }"
                      />
                    </a-col>
                    <a-col :span="6">
                      <a-statistic
                        title="Total Orders"
                        :value="revenueReport.summary.totalOrders"
                        :value-style="{ color: '#722ed1' }"
                      />
                    </a-col>
                  </a-row>
                  <a-row :gutter="16" style="margin-bottom: 24px">
                    <a-col :span="6">
                      <a-statistic
                        title="Discount Rate"
                        :value="revenueReport.summary.discountRate"
                        :precision="2"
                        suffix="%"
                        :value-style="{ color: '#cf1322' }"
                      />
                    </a-col>
                    <a-col :span="6">
                      <a-statistic
                        title="Profit Margin"
                        :value="revenueReport.summary.profitMargin"
                        :precision="2"
                        suffix="%"
                        :value-style="{ color: '#1890ff' }"
                      />
                    </a-col>
                    <a-col :span="6">
                      <a-statistic
                        title="Average Order Value"
                        :value="revenueReport.summary.averageOrderValue"
                        :precision="0"
                        suffix="VNĐ"
                        :value-style="{ color: '#3f8600' }"
                      />
                    </a-col>
                    <a-col :span="6">
                      <a-statistic
                        title="Average Profit per Order"
                        :value="revenueReport.summary.averageProfitPerOrder"
                        :precision="0"
                        suffix="VNĐ"
                        :value-style="{ color: '#1890ff' }"
                      />
                    </a-col>
                  </a-row>

                  <a-card title="Revenue Chart" style="margin-bottom: 16px">
                    <div id="report-chart" style="height: 350px"></div>
                  </a-card>

                  <a-card title="Details by Period">
                    <a-table
                      :columns="reportColumns"
                      :dataSource="revenueReport.revenueByPeriod"
                      :pagination="{ pageSize: 10 }"
                      rowKey="period"
                      size="small"
                    >
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'revenue'">
                          <strong style="color: #3f8600">{{ formatCurrency(record.revenue) }}</strong>
                        </template>
                        <template v-if="column.key === 'profit'">
                          <strong style="color: #1890ff">{{ formatCurrency(record.profit || 0) }}</strong>
                        </template>
                        <template v-if="column.key === 'discount'">
                          <span style="color: #cf1322">{{ formatCurrency(record.discount) }}</span>
                        </template>
                      </template>
                    </a-table>
                  </a-card>

                  <a-card title="Voucher Usage" style="margin-top: 16px" v-if="revenueReport.voucherUsage && revenueReport.voucherUsage.length > 0">
                    <a-table
                      :columns="voucherUsageColumns"
                      :dataSource="revenueReport.voucherUsage"
                      :pagination="{ pageSize: 10 }"
                      rowKey="voucherCode"
                      size="small"
                    >
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'totalDiscount'">
                          <strong style="color: #cf1322">{{ formatCurrency(record.totalDiscount) }}</strong>
                        </template>
                      </template>
                    </a-table>
                  </a-card>
                </div>
                <a-empty v-else description="Select date range and click Search to view data" />
              </a-spin>
            </a-card>
          </a-tab-pane>

          <!-- Compare Revenue -->
          <a-tab-pane key="compare" tab="Compare Revenue">
            <a-card>
              <a-form layout="inline" :model="compareForm" style="margin-bottom: 20px">
                <a-form-item label="From Date">
                  <a-date-picker
                    v-model:value="compareForm.startDate"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    placeholder="Select start date"
                    style="width: 150px"
                  />
                </a-form-item>
                <a-form-item label="To Date">
                  <a-date-picker
                    v-model:value="compareForm.endDate"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    placeholder="Select end date"
                    style="width: 150px"
                  />
                </a-form-item>
                <a-form-item label="Group By">
                  <a-select v-model:value="compareForm.groupBy" style="width: 120px">
                    <a-select-option value="day">Day</a-select-option>
                    <a-select-option value="week">Week</a-select-option>
                    <a-select-option value="month">Month</a-select-option>
                    <a-select-option value="year">Year</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item>
                  <a-button type="primary" @click="fetchCompareRevenue" :loading="compareLoading">
                    <SearchOutlined /> Compare
                  </a-button>
                  <a-button style="margin-left: 8px" @click="resetCompare">
                    <ReloadOutlined /> Reset
                  </a-button>
                </a-form-item>
              </a-form>

              <a-spin :spinning="compareLoading">
                <div v-if="revenueCompare.comparison">
                  <a-row :gutter="16" style="margin-bottom: 24px">
                    <a-col :span="6">
                      <a-card>
                        <a-statistic
                          title="Revenue - Current Period"
                          :value="revenueCompare.current.revenue"
                          :precision="0"
                          suffix="VNĐ"
                          :value-style="{ color: '#3f8600' }"
                        />
                        <div style="margin-top: 8px; font-size: 12px; color: #666">
                          Orders: {{ revenueCompare.current.orders }}
                        </div>
                      </a-card>
                    </a-col>
                    <a-col :span="6">
                      <a-card>
                        <a-statistic
                          title="Revenue - Previous Period"
                          :value="revenueCompare.previous.revenue"
                          :precision="0"
                          suffix="VNĐ"
                          :value-style="{ color: '#1890ff' }"
                        />
                        <div style="margin-top: 8px; font-size: 12px; color: #666">
                          Orders: {{ revenueCompare.previous.orders }}
                        </div>
                      </a-card>
                    </a-col>
                    <a-col :span="6">
                      <a-card>
                        <a-statistic
                          title="Profit - Current Period"
                          :value="revenueCompare.current.profit"
                          :precision="0"
                          suffix="VNĐ"
                          :value-style="{ color: '#52c41a' }"
                        />
                        <div style="margin-top: 8px; font-size: 12px; color: #666">
                          Margin: {{ revenueCompare.current.revenue > 0 ? ((revenueCompare.current.profit / revenueCompare.current.revenue) * 100).toFixed(2) : 0 }}%
                        </div>
                      </a-card>
                    </a-col>
                    <a-col :span="6">
                      <a-card>
                        <a-statistic
                          title="Profit - Previous Period"
                          :value="revenueCompare.previous.profit"
                          :precision="0"
                          suffix="VNĐ"
                          :value-style="{ color: '#13c2c2' }"
                        />
                        <div style="margin-top: 8px; font-size: 12px; color: #666">
                          Margin: {{ revenueCompare.previous.revenue > 0 ? ((revenueCompare.previous.profit / revenueCompare.previous.revenue) * 100).toFixed(2) : 0 }}%
                        </div>
                      </a-card>
                    </a-col>
                  </a-row>
                  <a-row :gutter="16" style="margin-bottom: 24px">
                    <a-col :span="6">
                      <a-card>
                        <a-statistic
                          title="Revenue Change"
                          :value="revenueCompare.comparison.revenueChange"
                          :precision="2"
                          suffix="%"
                          :value-style="{ 
                            color: revenueCompare.comparison.revenueChange >= 0 ? '#3f8600' : '#cf1322' 
                          }"
                        />
                        <div style="margin-top: 8px; font-size: 12px; color: #666">
                          Difference: {{ formatCurrency(revenueCompare.comparison.revenueDiff) }}
                        </div>
                      </a-card>
                    </a-col>
                    <a-col :span="6">
                      <a-card>
                        <a-statistic
                          title="Profit Change"
                          :value="revenueCompare.comparison.profitChange"
                          :precision="2"
                          suffix="%"
                          :value-style="{ 
                            color: revenueCompare.comparison.profitChange >= 0 ? '#52c41a' : '#cf1322' 
                          }"
                        />
                        <div style="margin-top: 8px; font-size: 12px; color: #666">
                          Difference: {{ formatCurrency(revenueCompare.comparison.profitDiff) }}
                        </div>
                      </a-card>
                    </a-col>
                    <a-col :span="6">
                      <a-card>
                        <a-statistic
                          title="Orders Change"
                          :value="revenueCompare.comparison.ordersChange"
                          :precision="2"
                          suffix="%"
                          :value-style="{ 
                            color: revenueCompare.comparison.ordersChange >= 0 ? '#1890ff' : '#cf1322' 
                          }"
                        />
                        <div style="margin-top: 8px; font-size: 12px; color: #666">
                          Difference: {{ revenueCompare.comparison.ordersDiff }}
                        </div>
                      </a-card>
                    </a-col>
                    <a-col :span="6">
                      <a-card>
                        <a-statistic
                          title="Discount Change"
                          :value="revenueCompare.comparison.discountChange"
                          :precision="2"
                          suffix="%"
                          :value-style="{ 
                            color: revenueCompare.comparison.discountChange >= 0 ? '#cf1322' : '#3f8600' 
                          }"
                        />
                        <div style="margin-top: 8px; font-size: 12px; color: #666">
                          Difference: {{ formatCurrency(revenueCompare.comparison.discountDiff) }}
                        </div>
                      </a-card>
                    </a-col>
                  </a-row>

                  <a-card title="Comparison Chart" style="margin-bottom: 16px">
                    <div id="compare-chart" style="height: 350px"></div>
                  </a-card>

                  <a-card title="Comparison Details">
                    <a-table
                      :columns="compareColumns"
                      :dataSource="compareTableData"
                      :pagination="{ pageSize: 10 }"
                      rowKey="period"
                      size="small"
                    >
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'current_revenue'">
                          <strong style="color: #3f8600">{{ formatCurrency(record.current_revenue) }}</strong>
                        </template>
                        <template v-if="column.key === 'previous_revenue'">
                          <span style="color: #1890ff">{{ formatCurrency(record.previous_revenue) }}</span>
                        </template>
                        <template v-if="column.key === 'current_profit'">
                          <strong style="color: #52c41a">{{ formatCurrency(record.current_profit) }}</strong>
                        </template>
                        <template v-if="column.key === 'previous_profit'">
                          <span style="color: #13c2c2">{{ formatCurrency(record.previous_profit) }}</span>
                        </template>
                        <template v-if="column.key === 'revenue_change'">
                          <a-tag :color="record.revenue_change >= 0 ? 'green' : 'red'">
                            {{ record.revenue_change >= 0 ? '+' : '' }}{{ record.revenue_change.toFixed(2) }}%
                          </a-tag>
                        </template>
                        <template v-if="column.key === 'profit_change'">
                          <a-tag :color="record.profit_change >= 0 ? 'green' : 'red'">
                            {{ record.profit_change >= 0 ? '+' : '' }}{{ record.profit_change.toFixed(2) }}%
                          </a-tag>
                        </template>
                      </template>
                    </a-table>
                  </a-card>
                </div>
                <a-empty v-else description="Select date range and click Compare to view data" />
              </a-spin>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script>
import { 
  getDashboardStats, 
  getRevenueByDateRange, 
  getRevenueByProduct, 
  getRevenueReport, 
  compareRevenue 
} from '@/apis/statisticsApi';
import { 
  UserOutlined, 
  ShoppingOutlined, 
  ShoppingCartOutlined, 
  DollarOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import moment from 'moment';

export default {
  name: 'StatisticsView',
  components: {
    UserOutlined,
    ShoppingOutlined,
    ShoppingCartOutlined,
    DollarOutlined,
    SearchOutlined,
    ReloadOutlined,
  },
  data() {
    return {
      activeTab: 'dashboard',
      revenueSubTab: 'date-range',
      loading: false,
      revenueLoading: false,
      productRevenueLoading: false,
      reportLoading: false,
      compareLoading: false,
      stats: {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        ordersByStatus: [],
        categoriesDistribution: [],
        revenueByMonth: [],
      },
      // Forms
      dateRangeForm: {
        startDate: null,
        endDate: null,
      },
      productRevenueForm: {
        startDate: null,
        endDate: null,
      },
      reportForm: {
        startDate: null,
        endDate: null,
        groupBy: 'day',
      },
      compareForm: {
        startDate: null,
        endDate: null,
        groupBy: 'day',
      },
      // Data
      revenueByDateRange: {},
      revenueByProduct: [],
      revenueReport: {},
      revenueCompare: {},
      // Columns
      statusColumns: [
        { title: 'Status', dataIndex: 'status', key: 'status' },
        { title: 'Count', dataIndex: 'count', key: 'count' },
      ],
      categoryColumns: [
        { title: 'Category', dataIndex: 'name', key: 'name' },
        { title: 'Products', dataIndex: 'count', key: 'count' },
      ],
      revenueDateRangeColumns: [
        { title: 'Order Date', dataIndex: 'order_date', key: 'order_date' },
        { title: 'Total Amount', dataIndex: 'total_price', key: 'total_price' },
        { title: 'Discount', dataIndex: 'discount_amount', key: 'discount_amount' },
        { title: 'Net Revenue', key: 'net_revenue' },
        { title: 'Voucher Code', dataIndex: 'voucher_code', key: 'voucher_code' },
      ],
      productRevenueColumns: [
        { title: 'Image', key: 'image', width: 80 },
        { title: 'Product Name', dataIndex: 'title', key: 'title' },
        { title: 'Price', dataIndex: 'price', key: 'price' },
        { title: 'Quantity Sold', dataIndex: 'quantitySold', key: 'quantitySold' },
        { title: 'Order Count', dataIndex: 'orderCount', key: 'orderCount' },
        { title: 'Revenue', dataIndex: 'revenue', key: 'revenue' },
        { title: 'Profit', dataIndex: 'profit', key: 'profit' },
      ],
      reportColumns: [
        { title: 'Period', dataIndex: 'period', key: 'period' },
        { title: 'Revenue', dataIndex: 'revenue', key: 'revenue' },
        { title: 'Profit', dataIndex: 'profit', key: 'profit' },
        { title: 'Discount', dataIndex: 'discount', key: 'discount' },
        { title: 'Order Count', dataIndex: 'orderCount', key: 'orderCount' },
      ],
      voucherUsageColumns: [
        { title: 'Voucher Code', dataIndex: 'voucherCode', key: 'voucherCode' },
        { title: 'Usage Count', dataIndex: 'usageCount', key: 'usageCount' },
        { title: 'Total Discount', dataIndex: 'totalDiscount', key: 'totalDiscount' },
      ],
      compareColumns: [
        { title: 'Period', dataIndex: 'period', key: 'period' },
        { title: 'Revenue - Current', key: 'current_revenue' },
        { title: 'Revenue - Previous', key: 'previous_revenue' },
        { title: 'Profit - Current', key: 'current_profit' },
        { title: 'Profit - Previous', key: 'previous_profit' },
        { title: 'Revenue Change', key: 'revenue_change' },
        { title: 'Profit Change', key: 'profit_change' },
      ],
    };
  },
  async created() {
    await this.fetchStats();
  },
  mounted() {
    // Re-render chart when component is mounted
    this.$nextTick(() => {
      setTimeout(() => {
        this.renderChart();
      }, 100);
    });
  },
  computed: {
    compareTableData() {
      if (!this.revenueCompare.current || !this.revenueCompare.previous) {
        return [];
      }
      
      const currentRevenueMap = {};
      const currentProfitMap = {};
      this.revenueCompare.current.data.forEach(item => {
        currentRevenueMap[item.period] = item.revenue || 0;
        currentProfitMap[item.period] = item.profit || 0;
      });
      
      const previousRevenueMap = {};
      const previousProfitMap = {};
      this.revenueCompare.previous.data.forEach(item => {
        previousRevenueMap[item.period] = item.revenue || 0;
        previousProfitMap[item.period] = item.profit || 0;
      });
      
      const allPeriods = [...new Set([
        ...Object.keys(currentRevenueMap),
        ...Object.keys(previousRevenueMap)
      ])].sort();
      
      return allPeriods.map(period => {
        const currentRevenue = currentRevenueMap[period] || 0;
        const previousRevenue = previousRevenueMap[period] || 0;
        const currentProfit = currentProfitMap[period] || 0;
        const previousProfit = previousProfitMap[period] || 0;
        
        const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        const profitChange = previousProfit > 0 ? ((currentProfit - previousProfit) / previousProfit) * 100 : 0;
        
        return {
          period,
          current_revenue: currentRevenue,
          previous_revenue: previousRevenue,
          current_profit: currentProfit,
          previous_profit: previousProfit,
          revenue_change: revenueChange,
          profit_change: profitChange
        };
      });
    }
  },
  watch: {
    activeTab(newTab) {
      // Re-render chart when switching to dashboard tab
      if (newTab === 'dashboard') {
        this.$nextTick(() => {
          this.renderChart();
        });
      } else if (newTab === 'revenue') {
        this.$nextTick(() => {
          if (this.revenueSubTab === 'report' && this.revenueReport.revenueByPeriod) {
            this.renderReportChart();
          } else if (this.revenueSubTab === 'compare' && this.revenueCompare.current) {
            this.renderCompareChart();
          }
        });
      }
    },
    revenueSubTab(newTab) {
      this.$nextTick(() => {
        if (newTab === 'report' && this.revenueReport.revenueByPeriod) {
          this.renderReportChart();
        } else if (newTab === 'compare' && this.revenueCompare.current) {
          this.renderCompareChart();
        }
      });
    }
  },
  methods: {
    getImageUrl(image) {
      if (!image) return '';
      // If image is already a full URL (http/https), return as-is
      if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
        return image;
      }
      // If image starts with /uploads, prepend base URL
      if (typeof image === 'string' && image.startsWith('/uploads')) {
        try {
          const apiUrl = import.meta?.env?.VITE_API_URL || 'http://127.0.0.1:3100';
          return `${apiUrl}${image}`;
        } catch (e) {
          return `http://127.0.0.1:3100${image}`;
        }
      }
      // Otherwise return as-is
      return image;
    },
    handleTabChange(key) {
      this.activeTab = key;
      if (key === 'dashboard') {
        this.$nextTick(() => {
          this.renderChart();
        });
      }
    },
    async fetchStats() {
      this.loading = true;
      try {
        const data = await getDashboardStats();
        console.log('📊 Dashboard stats received:', data);
        console.log('💰 Revenue by month:', data.revenueByMonth);
        console.log('💰 Revenue by month length:', data.revenueByMonth?.length);
        this.stats = data;
        
        // Đợi DOM update và render chart
        await this.$nextTick();
        setTimeout(() => {
          this.renderChart();
        }, 200);
      } catch (error) {
        console.error('❌ Error loading statistics:', error);
        message.error(error.message || 'Error loading statistics!');
      } finally {
        this.loading = false;
      }
    },
    renderChart() {
      // Simple chart rendering - you can use a charting library like Chart.js or ECharts
      console.log('🎨 renderChart called');
      console.log('📊 Current stats:', this.stats);
      console.log('💰 revenueByMonth:', this.stats.revenueByMonth);
      
      const chartContainer = document.getElementById('revenue-chart');
      console.log('📦 Chart container:', chartContainer);
      
      if (!chartContainer) {
        console.warn('⚠️ Chart container not found, retrying...');
        setTimeout(() => {
          this.renderChart();
        }, 500);
        return;
      }
      
      if (!this.stats.revenueByMonth) {
        console.warn('⚠️ revenueByMonth is undefined');
        chartContainer.innerHTML = `
          <div style="text-align: center; padding: 50px; color: #ffffff;">
            Loading data...
          </div>
        `;
        return;
      }
      
      if (!Array.isArray(this.stats.revenueByMonth)) {
        console.warn('⚠️ revenueByMonth is not an array:', typeof this.stats.revenueByMonth);
        chartContainer.innerHTML = `
          <div style="text-align: center; padding: 50px; color: #ffffff;">
            Invalid data
          </div>
        `;
        return;
      }
      
      if (this.stats.revenueByMonth.length === 0) {
        console.warn('⚠️ revenueByMonth is empty array');
        chartContainer.innerHTML = `
          <div style="text-align: center; padding: 50px; color: #ffffff;">
            No revenue data
          </div>
        `;
        return;
      }
      
      const revenues = this.stats.revenueByMonth.map(r => parseFloat(r.revenue || 0));
      const maxRevenue = Math.max(...revenues);
      
      console.log('📊 Max revenue:', maxRevenue, 'Revenues:', revenues);
      
      if (maxRevenue === 0 || isNaN(maxRevenue)) {
        chartContainer.innerHTML = `
          <div style="text-align: center; padding: 50px; color: #ffffff;">
            Revenue is zero
          </div>
        `;
        return;
      }
      
      const chartHTML = `
        <div style="display: flex; align-items: flex-end; height: 100%; gap: 10px; padding: 20px; min-height: 250px;">
          ${this.stats.revenueByMonth.map(item => {
            const revenue = parseFloat(item.revenue || 0);
            const height = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
            const displayValue = revenue >= 1000000 
              ? `${(revenue / 1000000).toFixed(1)}M` 
              : revenue >= 1000 
                ? `${(revenue / 1000).toFixed(1)}K` 
                : revenue.toFixed(0);
            return `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-height: 100%;">
                <div style="background: linear-gradient(to top, #1890ff, #40a9ff); width: 100%; height: ${Math.max(height, 5)}%; margin-bottom: 8px; border-radius: 4px 4px 0 0; min-height: 20px; position: relative; cursor: pointer;" title="Revenue: ${this.formatCurrency(revenue)}">
                  <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 11px; font-weight: bold; color: #1890ff; white-space: nowrap; background: rgba(255,255,255,0.9); padding: 2px 4px; border-radius: 2px;">${displayValue}</div>
                </div>
                <div style="font-size: 12px; text-align: center; font-weight: 500; color: #ffffff; margin-top: 4px;">${item.month || 'N/A'}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      chartContainer.innerHTML = chartHTML;
      console.log('✅ Chart rendered successfully with', this.stats.revenueByMonth.length, 'months');
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value);
    },
    formatDate(date) {
      if (!date) return '-';
      return moment(date).format('DD/MM/YYYY');
    },
    // Revenue by date range - DÙNG value-format ĐỂ NHẬN STRING TRỰC TIẾP
    async fetchRevenueByDateRange() {
      // Kiểm tra có date không
      if (!this.dateRangeForm.startDate || !this.dateRangeForm.endDate) {
        message.warning('Please select both start and end dates');
        return;
      }
      
      // Với value-format="YYYY-MM-DD", date picker đã trả về string YYYY-MM-DD
      let startDateStr = String(this.dateRangeForm.startDate).trim();
      let endDateStr = String(this.dateRangeForm.endDate).trim();
      
      try {
        // Validate format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
          message.error('Invalid date format');
          console.error('❌ Invalid date format:', { startDateStr, endDateStr });
          return;
        }
        
        // Kiểm tra startDate <= endDate
        if (moment(startDateStr).isAfter(moment(endDateStr))) {
          message.warning('Start date must be less than or equal to end date');
          return;
        }
        
        console.log('📅 Frontend - Date strings (from value-format):', {
          start: startDateStr,
          end: endDateStr,
          startType: typeof startDateStr,
          endType: typeof endDateStr
        });
        
        this.revenueLoading = true;
        const data = await getRevenueByDateRange(startDateStr, endDateStr);
        
        console.log('📊 Revenue data received:', {
          ordersCount: data.orders?.length,
          summary: data.summary
        });
        
        this.revenueByDateRange = data;
      } catch (error) {
        console.error('❌ Error fetching revenue:', error);
        message.error(error.message || 'Error loading revenue data');
      } finally {
        this.revenueLoading = false;
      }
    },
    resetDateRange() {
      this.dateRangeForm = { startDate: null, endDate: null };
      this.revenueByDateRange = {};
    },
    // Revenue by product - DÙNG value-format ĐỂ NHẬN STRING TRỰC TIẾP
    async fetchRevenueByProduct() {
      // Kiểm tra có date không
      if (!this.productRevenueForm.startDate || !this.productRevenueForm.endDate) {
        message.warning('Please select both start and end dates');
        return;
      }
      
      // Với value-format="YYYY-MM-DD", date picker đã trả về string YYYY-MM-DD
      let startDateStr = String(this.productRevenueForm.startDate).trim();
      let endDateStr = String(this.productRevenueForm.endDate).trim();
      
      try {
        // Validate format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
          message.error('Invalid date format');
          console.error('❌ Invalid date format:', { startDateStr, endDateStr });
          return;
        }
        
        // Kiểm tra startDate <= endDate
        if (moment(startDateStr).isAfter(moment(endDateStr))) {
          message.warning('Start date must be less than or equal to end date');
          return;
        }
        
        console.log('📅 Frontend - Product revenue date strings:', {
          start: startDateStr,
          end: endDateStr
        });
        
        this.productRevenueLoading = true;
        const data = await getRevenueByProduct(startDateStr, endDateStr);
        this.revenueByProduct = data || [];
      } catch (error) {
        console.error('❌ Error fetching product revenue:', error);
        message.error(error.message || 'Error loading product revenue data');
      } finally {
        this.productRevenueLoading = false;
      }
    },
    resetProductRevenue() {
      this.productRevenueForm = { startDate: null, endDate: null };
      this.revenueByProduct = [];
    },
    // Revenue report - DÙNG value-format ĐỂ NHẬN STRING TRỰC TIẾP
    async fetchRevenueReport() {
      if (!this.reportForm.startDate || !this.reportForm.endDate) {
        message.warning('Please select date range');
        return;
      }
      
      // Với value-format="YYYY-MM-DD", date picker đã trả về string YYYY-MM-DD
      let startDateStr = String(this.reportForm.startDate).trim();
      let endDateStr = String(this.reportForm.endDate).trim();
      
      try {
        // Validate format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
          message.error('Invalid date format');
          console.error('❌ Invalid date format:', { startDateStr, endDateStr });
          return;
        }
        
        // Kiểm tra startDate <= endDate
        if (moment(startDateStr).isAfter(moment(endDateStr))) {
          message.warning('Start date must be less than or equal to end date');
          return;
        }
        
        console.log('📅 Frontend - Report date strings:', {
          start: startDateStr,
          end: endDateStr,
          groupBy: this.reportForm.groupBy
        });
        
        this.reportLoading = true;
        const data = await getRevenueReport(startDateStr, endDateStr, this.reportForm.groupBy);
        this.revenueReport = data;
        this.$nextTick(() => {
          this.renderReportChart();
        });
      } catch (error) {
        console.error('❌ Error fetching revenue report:', error);
        message.error(error.message || 'Error loading revenue report');
      } finally {
        this.reportLoading = false;
      }
    },
    resetReport() {
      this.reportForm = { startDate: null, endDate: null, groupBy: 'day' };
      this.revenueReport = {};
    },
    renderReportChart() {
      const chartContainer = document.getElementById('report-chart');
      if (!chartContainer || !this.revenueReport.revenueByPeriod) return;
      
      const data = this.revenueReport.revenueByPeriod;
      if (data.length === 0) {
        chartContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">No data</div>';
        return;
      }
      
      const revenues = data.map(d => d.revenue || 0);
      const profits = data.map(d => d.profit || 0);
      const discounts = data.map(d => d.discount || 0);
      const maxValue = Math.max(...revenues, ...profits, ...discounts);
      
      chartContainer.innerHTML = `
        <div style="display: flex; align-items: flex-end; height: 100%; gap: 8px; padding: 20px;">
          ${data.map((item) => {
            const revenueHeight = maxValue > 0 ? ((item.revenue || 0) / maxValue) * 100 : 0;
            const profitHeight = maxValue > 0 ? ((item.profit || 0) / maxValue) * 100 : 0;
            const discountHeight = maxValue > 0 ? ((item.discount || 0) / maxValue) * 100 : 0;
            return `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative;">
                <div style="display: flex; align-items: flex-end; width: 100%; height: 250px; gap: 2px;">
                  <div style="flex: 1; background: linear-gradient(to top, #3f8600, #52c41a); height: ${Math.max(revenueHeight, 2)}%; border-radius: 4px 4px 0 0; min-height: 10px; position: relative;" title="Revenue: ${this.formatCurrency(item.revenue || 0)}">
                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: bold; color: #3f8600; white-space: nowrap;">${((item.revenue || 0) / 1000000).toFixed(1)}M</div>
                  </div>
                  <div style="flex: 1; background: linear-gradient(to top, #1890ff, #40a9ff); height: ${Math.max(profitHeight, 2)}%; border-radius: 4px 4px 0 0; min-height: 10px; position: relative;" title="Profit: ${this.formatCurrency(item.profit || 0)}">
                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: bold; color: #1890ff; white-space: nowrap;">${((item.profit || 0) / 1000000).toFixed(1)}M</div>
                  </div>
                  <div style="flex: 1; background: linear-gradient(to top, #cf1322, #ff4d4f); height: ${Math.max(discountHeight, 2)}%; border-radius: 4px 4px 0 0; min-height: 10px; position: relative;" title="Discount: ${this.formatCurrency(item.discount || 0)}">
                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: bold; color: #cf1322; white-space: nowrap;">${((item.discount || 0) / 1000000).toFixed(1)}M</div>
                  </div>
                </div>
                <div style="font-size: 11px; text-align: center; font-weight: 500; margin-top: 8px;">${item.period}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 20px; background: linear-gradient(to top, #3f8600, #52c41a); border-radius: 4px;"></div>
            <span style="font-size: 12px;">Revenue</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 20px; background: linear-gradient(to top, #1890ff, #40a9ff); border-radius: 4px;"></div>
            <span style="font-size: 12px;">Profit</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 20px; background: linear-gradient(to top, #cf1322, #ff4d4f); border-radius: 4px;"></div>
            <span style="font-size: 12px;">Discount</span>
          </div>
        </div>
      `;
    },
    // Compare revenue - DÙNG value-format ĐỂ NHẬN STRING TRỰC TIẾP
    async fetchCompareRevenue() {
      if (!this.compareForm.startDate || !this.compareForm.endDate) {
        message.warning('Please select date range');
        return;
      }
      
      // Với value-format="YYYY-MM-DD", date picker đã trả về string YYYY-MM-DD
      let startDateStr = String(this.compareForm.startDate).trim();
      let endDateStr = String(this.compareForm.endDate).trim();
      
      try {
        // Validate format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
          message.error('Invalid date format');
          console.error('❌ Invalid date format:', { startDateStr, endDateStr });
          return;
        }
        
        // Kiểm tra startDate <= endDate
        if (moment(startDateStr).isAfter(moment(endDateStr))) {
          message.warning('Start date must be less than or equal to end date');
          return;
        }
        
        console.log('📅 Frontend - Compare date strings:', {
          start: startDateStr,
          end: endDateStr,
          groupBy: this.compareForm.groupBy
        });
        
        this.compareLoading = true;
        const data = await compareRevenue(startDateStr, endDateStr, this.compareForm.groupBy);
        this.revenueCompare = data;
        this.$nextTick(() => {
          this.renderCompareChart();
        });
      } catch (error) {
        console.error('❌ Error fetching compare revenue:', error);
        message.error(error.message || 'Error comparing revenue');
      } finally {
        this.compareLoading = false;
      }
    },
    resetCompare() {
      this.compareForm = { startDate: null, endDate: null, groupBy: 'day' };
      this.revenueCompare = {};
    },
    renderCompareChart() {
      const chartContainer = document.getElementById('compare-chart');
      if (!chartContainer || !this.revenueCompare.current || !this.revenueCompare.previous) return;
      
      const currentData = this.revenueCompare.current.data;
      const previousData = this.revenueCompare.previous.data;
      
      if (currentData.length === 0 && previousData.length === 0) {
        chartContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">No data</div>';
        return;
      }
      
      const currentRevenueMap = {};
      const currentProfitMap = {};
      currentData.forEach(item => {
        currentRevenueMap[item.period] = item.revenue || 0;
        currentProfitMap[item.period] = item.profit || 0;
      });
      
      const previousRevenueMap = {};
      const previousProfitMap = {};
      previousData.forEach(item => {
        previousRevenueMap[item.period] = item.revenue || 0;
        previousProfitMap[item.period] = item.profit || 0;
      });
      
      const allPeriods = [...new Set([
        ...Object.keys(currentRevenueMap), 
        ...Object.keys(previousRevenueMap)
      ])].sort();
      
      const maxValue = Math.max(
        ...allPeriods.map(p => currentRevenueMap[p] || 0),
        ...allPeriods.map(p => previousRevenueMap[p] || 0),
        ...allPeriods.map(p => currentProfitMap[p] || 0),
        ...allPeriods.map(p => previousProfitMap[p] || 0)
      );
      
      chartContainer.innerHTML = `
        <div style="display: flex; align-items: flex-end; height: 100%; gap: 8px; padding: 20px;">
          ${allPeriods.map(period => {
            const currentRevenue = currentRevenueMap[period] || 0;
            const previousRevenue = previousRevenueMap[period] || 0;
            const currentProfit = currentProfitMap[period] || 0;
            const previousProfit = previousProfitMap[period] || 0;
            
            const currentRevHeight = maxValue > 0 ? (currentRevenue / maxValue) * 100 : 0;
            const previousRevHeight = maxValue > 0 ? (previousRevenue / maxValue) * 100 : 0;
            const currentProfHeight = maxValue > 0 ? (currentProfit / maxValue) * 100 : 0;
            const previousProfHeight = maxValue > 0 ? (previousProfit / maxValue) * 100 : 0;
            
            return `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative;">
                <div style="display: flex; align-items: flex-end; width: 100%; height: 250px; gap: 2px;">
                  <div style="flex: 1; background: linear-gradient(to top, #3f8600, #52c41a); height: ${Math.max(currentRevHeight, 2)}%; border-radius: 4px 4px 0 0; min-height: 10px; position: relative;" title="Current Period Revenue: ${this.formatCurrency(currentRevenue)}">
                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: bold; color: #3f8600; white-space: nowrap;">R: ${(currentRevenue / 1000000).toFixed(1)}M</div>
                  </div>
                  <div style="flex: 1; background: linear-gradient(to top, #1890ff, #40a9ff); height: ${Math.max(currentProfHeight, 2)}%; border-radius: 4px 4px 0 0; min-height: 10px; position: relative;" title="Current Period Profit: ${this.formatCurrency(currentProfit)}">
                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: bold; color: #1890ff; white-space: nowrap;">P: ${(currentProfit / 1000000).toFixed(1)}M</div>
                  </div>
                  <div style="flex: 1; background: linear-gradient(to top, #722ed1, #9254de); height: ${Math.max(previousRevHeight, 2)}%; border-radius: 4px 4px 0 0; min-height: 10px; position: relative;" title="Previous Period Revenue: ${this.formatCurrency(previousRevenue)}">
                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: bold; color: #722ed1; white-space: nowrap;">R: ${(previousRevenue / 1000000).toFixed(1)}M</div>
                  </div>
                  <div style="flex: 1; background: linear-gradient(to top, #13c2c2, #36cfc9); height: ${Math.max(previousProfHeight, 2)}%; border-radius: 4px 4px 0 0; min-height: 10px; position: relative;" title="Previous Period Profit: ${this.formatCurrency(previousProfit)}">
                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: bold; color: #13c2c2; white-space: nowrap;">P: ${(previousProfit / 1000000).toFixed(1)}M</div>
                  </div>
                </div>
                <div style="font-size: 11px; text-align: center; font-weight: 500; margin-top: 8px;">${period}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 20px; background: linear-gradient(to top, #3f8600, #52c41a); border-radius: 4px;"></div>
            <span style="font-size: 12px;">Revenue - Current</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 20px; background: linear-gradient(to top, #1890ff, #40a9ff); border-radius: 4px;"></div>
            <span style="font-size: 12px;">Profit - Current</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 20px; background: linear-gradient(to top, #722ed1, #9254de); border-radius: 4px;"></div>
            <span style="font-size: 12px;">Revenue - Previous</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 20px; background: linear-gradient(to top, #13c2c2, #36cfc9); border-radius: 4px;"></div>
            <span style="font-size: 12px;">Profit - Previous</span>
          </div>
        </div>
      `;
    }
  }
};
</script>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}

/* Chỉ sửa màu trắng cho các tiêu đề trong container có background tối (#111) */
/* Breadcrumb */
.ant-breadcrumb,
.ant-breadcrumb *,
.ant-breadcrumb-link,
.ant-breadcrumb-link *,
.ant-breadcrumb-separator {
  color: #ffffff !important;
}

/* Tab chính (Dashboard, Quản lý Doanh thu) - FORCE màu trắng */
.ant-tabs-tab,
.ant-tabs-tab *,
.ant-tabs-tab-btn,
.ant-tabs-tab-btn *,
.ant-tabs-tab span,
.ant-tabs-tab div {
  color: #ffffff !important;
}

.ant-tabs-tab-active,
.ant-tabs-tab-active *,
.ant-tabs-tab-active .ant-tabs-tab-btn,
.ant-tabs-tab-active .ant-tabs-tab-btn *,
.ant-tabs-tab-active span,
.ant-tabs-tab-active div {
  color: #ffffff !important;
  font-weight: 600;
}

.ant-tabs-tab:hover,
.ant-tabs-tab:hover *,
.ant-tabs-tab:hover span,
.ant-tabs-tab:hover div {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Đảm bảo tất cả text trong tab đều trắng */
.ant-tabs-nav .ant-tabs-tab,
.ant-tabs-nav .ant-tabs-tab *,
.ant-tabs-nav-wrap .ant-tabs-tab,
.ant-tabs-nav-wrap .ant-tabs-tab * {
  color: #ffffff !important;
}

/* Force màu trắng cho tất cả tab bằng ::v-deep */
::v-deep(.ant-tabs-tab) {
  color: #ffffff !important;
  transition: color 0.3s;
}

::v-deep(.ant-tabs-tab *) {
  color: #ffffff !important;
  transition: color 0.3s;
}

::v-deep(.ant-tabs-tab-btn) {
  color: #ffffff !important;
  transition: color 0.3s;
}

::v-deep(.ant-tabs-tab-btn *) {
  color: #ffffff !important;
  transition: color 0.3s;
}

::v-deep(.ant-tabs-tab:hover) {
  color: #1890ff !important;
}

::v-deep(.ant-tabs-tab:hover *) {
  color: #1890ff !important;
}

::v-deep(.ant-tabs-tab:hover .ant-tabs-tab-btn) {
  color: #1890ff !important;
}

::v-deep(.ant-tabs-tab-active) {
  color: #1890ff !important;
}

::v-deep(.ant-tabs-tab-active *) {
  color: #1890ff !important;
}

::v-deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #1890ff !important;
  font-weight: 600;
}

/* Tab con trong Quản lý Doanh thu (type="card") */
.ant-tabs-card .ant-tabs-tab,
.ant-tabs-card .ant-tabs-tab *,
.ant-tabs-card .ant-tabs-tab-btn,
.ant-tabs-card .ant-tabs-tab-btn * {
  color: #ffffff !important;
  transition: color 0.3s;
}

.ant-tabs-card .ant-tabs-tab:hover,
.ant-tabs-card .ant-tabs-tab:hover *,
.ant-tabs-card .ant-tabs-tab:hover .ant-tabs-tab-btn,
.ant-tabs-card .ant-tabs-tab:hover .ant-tabs-tab-btn * {
  color: #1890ff !important;
}

.ant-tabs-card .ant-tabs-tab-active,
.ant-tabs-card .ant-tabs-tab-active *,
.ant-tabs-card .ant-tabs-tab-active .ant-tabs-tab-btn,
.ant-tabs-card .ant-tabs-tab-active .ant-tabs-tab-btn * {
  color: #1890ff !important;
  font-weight: 600;
}

/* Card title - TẤT CẢ các tiêu đề card */
.ant-card-head-title,
.ant-card-head-title * {
  color: #ffffff !important;
}

/* Bảng header */
.ant-table-thead > tr > th,
.ant-table-thead > tr > th * {
  color: #ffffff !important;
}

/* Statistic title */
.ant-statistic-title,
.ant-statistic-title * {
  color: #ffffff !important;
}

/* Form label */
.ant-form-item-label,
.ant-form-item-label > label,
.ant-form-item-label > label * {
  color: #ffffff !important;
}
</style>

